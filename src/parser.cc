// Copyright (c) 2016-2017 JSTP project authors. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.
// Copyright (c) 2018 mdsf project authors. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.

#include "parser.h"

#include <cctype>
#include <cerrno>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <functional>
#include <vector>

#include "common.h"
#include "unicode_utils.h"

using std::atof;
using std::function;
using std::isalnum;
using std::isalpha;
using std::isdigit;
using std::isxdigit;
using std::memcpy;
using std::memset;
using std::ptrdiff_t;
using std::size_t;
using std::strncmp;
using std::strncpy;
using std::strtol;
using std::toupper;

using v8::Array;
using v8::False;
using v8::Integer;
using v8::Isolate;
using v8::Local;
using v8::Maybe;
using v8::MaybeLocal;
using v8::NewStringType;
using v8::Null;
using v8::Number;
using v8::Object;
using v8::String;
using v8::True;
using v8::Undefined;
using v8::Value;

using mdsf::unicode_utils::CodePointToUtf8;
using mdsf::unicode_utils::IsWhiteSpaceCharacter;
using mdsf::unicode_utils::IsLineTerminatorSequence;
using mdsf::unicode_utils::Utf8ToCodePoint;
using mdsf::unicode_utils::IsIdStartCodePoint;
using mdsf::unicode_utils::IsIdPartCodePoint;

namespace mdsf {

namespace parser {

// Enumeration of supported JavaScript types used for deserialization
// function selection.
enum Type {
  kUndefined = 0, kNull, kBool, kNumber, kString, kArray, kObject, kDate
};

// Parses the type of the serialized JavaScript value at the position `begin`
// and before `end`. Returns true if it was able to detect the type, false
// otherwise.
static bool GetType(const char* begin, const char* end, Type* type);

// The table of parsing functions indexed with the values of the Type
// enumeration.
static constexpr MaybeLocal<Value> (*kParseFunctions[])(Isolate*,
                                                        const char*,
                                                        const char*,
                                                        size_t*) = {
  &internal::ParseUndefined,
  &internal::ParseNull,
  &internal::ParseBool,
  &internal::ParseNumber,
  &internal::ParseString,
  &internal::ParseArray,
  &internal::ParseObject
};

Local<Value> Parse(Isolate* isolate, const char* str, size_t length) {
  const char* end = str + length;

  Type type;

  size_t start_pos = internal::SkipToNextToken(str, end);
  if (!GetType(str + start_pos, end, &type)) {
    THROW_EXCEPTION(TypeError, "Invalid type");
    return Undefined(isolate);
  }

  size_t parsed_size = 0;
  MaybeLocal<Value> result = kParseFunctions[type](isolate,
                                                   str + start_pos,
                                                   end,
                                                   &parsed_size);

  if (result.IsEmpty()) {
    return Undefined(isolate);
  }

  parsed_size += internal::SkipToNextToken(str + start_pos + parsed_size, end);
  parsed_size += start_pos;

  if (length != parsed_size) {
    THROW_EXCEPTION(SyntaxError, "Invalid format");
    return Undefined(isolate);
  }

  return result.ToLocalChecked();
}

static bool GetType(const char* begin, const char* end, Type* type) {
  bool result = true;
  switch (*begin) {
    case ',':
    case ']': {
      *type = Type::kUndefined;
      break;
    }
    case '{': {
      *type = Type::kObject;
      break;
    }
    case '[': {
      *type = Type::kArray;
      break;
    }
    case '\"':
    case '\'': {
      *type = Type::kString;
      break;
    }
    case 't':
    case 'f': {
      *type = Type::kBool;
      break;
    }
    case 'n': {
      *type = Type::kNull;
      if (begin + 4 <= end) {
        result = (strncmp(begin, "null", 4) == 0);
      }
      break;
    }
    case 'u': {
      *type = Type::kUndefined;
      if (begin + 9 <= end) {
        result = (strncmp(begin, "undefined", 9) == 0);
      }
      break;
    }
    case 'N':
    case 'I': {
      *type = Type::kNumber;
      break;
    }
    default: {
      result = false;
      if (isdigit(*begin) || *begin == '.' || *begin == '+' || *begin == '-') {
        *type = Type::kNumber;
        result = true;
      }
    }
  }
  return result;
}

namespace internal {

// Returns true if `str` points to a multiline comment ending, false otherwise.
bool IsMultilineCommentEnd(const char* str, size_t* size) {
  if (str[0] == '*' && str[1] == '/') {
    *size = 2;
    return true;
  }
  return false;
}

// Returns count of bytes needed to skip to current comment ending.
size_t SkipToCommentEnd(const char* str, const char* end) {
  bool is_single_line;

  switch (str[1]) {
    case '/': {
      is_single_line = true;
      break;
    }
    case '*': {
      is_single_line = false;
      break;
    }
    default: {  // In case it is not a comment start
      return 0;
    }
  }

  function<bool(const char*, size_t*)> end_check_func;

  if (is_single_line) {
    end_check_func = IsLineTerminatorSequence;
  } else {
    end_check_func = IsMultilineCommentEnd;
  }

  const size_t size = end - str;

  size_t pos = 2;
  size_t current_size;

  for (; pos < size; pos++) {
    if (end_check_func(str + pos, &current_size)) {
      return pos + current_size;
    }
  }

  if (is_single_line) {
    return pos;
  } else {
    return 0;
  }
}

size_t SkipToNextToken(const char* str, const char* end) {
  size_t pos = 0;
  size_t current_size;
  const size_t size = end - str;

  while (pos < size) {
    if (IsWhiteSpaceCharacter(str + pos, &current_size) ||
        IsLineTerminatorSequence(str + pos, &current_size)) {
      pos += current_size;
    } else if (str[pos] == '/') {
      size_t to_skip = SkipToCommentEnd(str + pos, end);
      if (!to_skip) {
        break;
      }
      pos += to_skip;
    } else {
      break;
    }
  }

  return pos;
}

MaybeLocal<Value> ParseUndefined(Isolate*    isolate,
                                 const char* begin,
                                 const char* end,
                                 size_t*     size) {
  if (*begin == ',' || *begin == ']') {
    *size = 0;
  } else if (*begin == 'u') {
    *size = 9;
  } else {
    THROW_EXCEPTION(TypeError, "Invalid format of undefined value");
    return MaybeLocal<Value>();
  }
  return Undefined(isolate);
}

MaybeLocal<Value> ParseNull(Isolate*    isolate,
                            const char* begin,
                            const char* end,
                            size_t*     size) {
  *size = 4;
  return Null(isolate);
}

MaybeLocal<Value> ParseBool(Isolate*    isolate,
                            const char* begin,
                            const char* end,
                            size_t*     size) {
  MaybeLocal<Value> result;
  if (begin + 4 <= end && strncmp(begin, "true", 4) == 0) {
    result = True(isolate);
    *size = 4;
  } else if (begin + 5 <= end && strncmp(begin, "false", 5) == 0) {
    result = False(isolate);
    *size = 5;
  } else {
    THROW_EXCEPTION(TypeError, "Invalid format: expected boolean");
  }
  return result;
}

MaybeLocal<Value> ParseNumber(Isolate*    isolate,
                              const char* begin,
                              const char* end,
                              size_t*     size) {
  bool negate_result = false;
  const char* number_start = begin;

  if (*begin == '+' || *begin == '-') {
    negate_result = *begin == '-';
    number_start++;
  }

  int base = 10;

  if (*number_start == '0') {
    number_start++;

    if (*number_start == 'b' || *number_start == 'B') {
      base = 2;
      number_start++;
    } else if (*number_start == 'o' || *number_start == 'O') {
      base = 8;
      number_start++;
    } else if (*number_start == 'x' || *number_start == 'X') {
      base = 16;
      number_start++;
    } else if (isdigit(*number_start)) {
      THROW_EXCEPTION(SyntaxError,
          "Legacy octal and non-octal integer literals are not supported");
      return MaybeLocal<Value>();
    } else {
      number_start--;
    }
  }

  MaybeLocal<Value> result;

  if (base == 10) {
    result = ParseDecimalNumber(isolate, number_start, end, size,
                                negate_result);
  } else {
    result = ParseIntegerNumber(isolate, number_start, end, size,
                                base, negate_result);
    if (*size == 0) {
      THROW_EXCEPTION(SyntaxError, "Empty number value");
      return MaybeLocal<Value>();
    }
  }
  *size += number_start - begin;
  return result;
}

MaybeLocal<Value> ParseDecimalNumber(Isolate*    isolate,
                                     const char* begin,
                                     const char* end,
                                     size_t*     size,
                                     bool        negate_result) {
  char* number_end;
  double number = strtod(begin, &number_end);

  if (negate_result) {
    number = -number;
  }

  // strictly allow only "NaN" and "Infinity"
  if (std::isnan(number)) {
    if (strncmp(begin + 1, "aN", 2) != 0) {
      THROW_EXCEPTION(SyntaxError, "Invalid format: expected NaN");
      return MaybeLocal<Value>();
    }
  } else if (std::isinf(number)) {
    if (strncmp(begin + 1, "nfinity", 7) != 0) {
      THROW_EXCEPTION(SyntaxError, "Invalid format: expected Infinity");
      return MaybeLocal<Value>();
    }
  }

  *size = number_end - begin;
  return Number::New(isolate, number);
}

Local<Value> ParseIntegerNumber(Isolate*    isolate,
                                const char* begin,
                                const char* end,
                                size_t*     size,
                                int         base,
                                bool        negate_result) {
  char* number_end;
  long long value = strtoll(begin, &number_end, base);
  if (errno == ERANGE) {
    errno = 0;
    return ParseBigIntegerNumber(isolate, begin, end, size,
                                 base, negate_result);
  }
  if (negate_result) {
    value = -value;
  }
  *size = static_cast<size_t>(number_end - begin);
  if (value > INT32_MIN && value < INT32_MAX) {
    return Integer::New(isolate, value);
  } else {
    return Number::New(isolate, value);
  }
}

Local<Value> ParseBigIntegerNumber(Isolate*    isolate,
                                   const char* begin,
                                   const char* end,
                                   size_t*     size,
                                   int         base,
                                   bool        negate_result) {
  *size = end - begin;
  double result = 0.0;
  char current_digit;
  double current_digit_value;
  char base_digit_count = base > 10 ? 10 : base;
  char base_alpha_count = base > 10 ? base - 10 : 0;
  for (size_t i = 0; i < *size; i++) {
    current_digit = toupper(begin[i]);
    if ((current_digit < '0' || current_digit >= '0' + base_digit_count) &&
        (current_digit < 'A' || current_digit >= 'A' + base_alpha_count)) {
      *size = i;
      break;
    }
    current_digit_value = current_digit <= '9' ? current_digit - '0' :
                                                 current_digit - 'A' + 10;
    result *= base;
    result += current_digit_value;
  }
  return Number::New(isolate, negate_result ? -result : result);
}

static bool GetControlChar(Isolate*    isolate,
                           const char* str,
                           size_t*     res_len,
                           size_t*     size,
                           char*       write_to);

MaybeLocal<Value> ParseString(Isolate*    isolate,
                              const char* begin,
                              const char* end,
                              size_t*     size) {
  *size = end - begin;
  char* result = nullptr;

  enum { kApostrophe = 0, kQMarks} string_mode = (*begin == '\'') ?
                                                 kApostrophe :
                                                 kQMarks;
  bool is_ended = false;
  size_t res_index = 0;
  size_t out_offset, in_offset;

  for (size_t i = 1; i < *size; i++) {
    if ((string_mode == kQMarks     && begin[i] == '\"') ||
        (string_mode == kApostrophe && begin[i] == '\'')) {
      is_ended = true;
      *size = i + 1;
      break;
    }

    if (begin[i] == '\\') {
      if (!result) {
        result = new char[*size + 1];
        memcpy(result, begin + 1, i - 1);
      }
      if (IsLineTerminatorSequence(begin + i + 1, &in_offset)) {
        i += in_offset;
      } else {
        bool ok = GetControlChar(isolate, begin + ++i, &out_offset, &in_offset,
                                 result + res_index);
        if (!ok) {
          delete[] result;
          return MaybeLocal<Value>();
        }
        i += in_offset - 1;
        res_index += out_offset;
      }
    } else if (IsLineTerminatorSequence(begin + i, &in_offset)) {
      delete[] result;
      THROW_EXCEPTION(SyntaxError, "Unexpected line end in string");
      return MaybeLocal<Value>();
    } else {
      if (result) {
        result[res_index] = begin[i];
      }
      res_index++;
    }
  }

  if (!is_ended) {
    delete[] result;
    THROW_EXCEPTION(SyntaxError, "Error while parsing string");
    return MaybeLocal<Value>();
  }

  Local<String> result_str;
  if (result) {
    result_str = NewFromUtf8OrEmpty(isolate, result, v8::NewStringType::kNormal,
        static_cast<int>(res_index));
    delete[] result;
  } else {
    result_str = NewFromUtf8OrEmpty(isolate, begin + 1,
        v8::NewStringType::kNormal, static_cast<int>(*size - 2));
  }
  return result_str;
}

static uint32_t ReadHexNumber(const char* str,
                              size_t required_len,
                              bool is_limited,
                              size_t* len,
                              bool* ok);

// Parses a Unicode escape sequence after the '\u' part and returns it's
// code point value. Supports surrogate pairs. Total size of escape
// sequence (excluding first '\u') is written in `size`.
static uint32_t ReadUnicodeEscapeSequence(Isolate* isolate,
                                          const char* str,
                                          size_t* size,
                                          bool* ok) {
  uint32_t result = 0xFFFD;

  if (isxdigit(str[0])) {
    result = ReadHexNumber(str, 4, true, nullptr, ok);
    if (!*ok) {
      THROW_EXCEPTION(SyntaxError, "Invalid Unicode escape sequence");
      return 0xFFFD;
    }
    *size = 4;
  } else if (str[0] == '{') {
    size_t hex_size;
    result = ReadHexNumber(str + 1, 0, false, &hex_size, ok);
    if (!*ok || result > 0x10FFFF) {
      THROW_EXCEPTION(SyntaxError, "Invalid Unicode escape sequence");
      return 0xFFFD;
    }
    *size = hex_size + 2;
  } else {
    THROW_EXCEPTION(SyntaxError, "Expected Unicode escape sequence");
    *ok = false;
  }

  // check for surrogate pair
  if (0xD800 <= result && result <= 0xDBFF) {
    size_t low_size;
    if (str[*size] == '\\' && str[*size + 1] == 'u') {
      uint32_t low_sur = ReadUnicodeEscapeSequence(isolate,
                                                   str + *size + 2,
                                                   &low_size, ok);
      if (!*ok || !(0xDC00 <= low_sur && low_sur <= 0xDFFF)) {
        return result;
      }
      result = ((result - 0xD800) << 10) + low_sur - 0xDC00 + 0x10000;
      *size += low_size + 2;
    }
  }

  return result;
}

// Parses a part of a JavaScript string representation after the backslash
// character (i.e., an escape sequence without \) into an unescaped control
// character and writes it to `write_to`.
// Returns true if no error occured, false otherwise.
static bool GetControlChar(Isolate*    isolate,
                           const char* str,
                           size_t*     res_len,
                           size_t*     size,
                           char*       write_to) {
  *size = 1;
  *res_len = 1;
  bool ok;
  switch (str[0]) {
    case 'b': {
      *write_to = '\b';
      break;
    }
    case 'f': {
      *write_to = '\f';
      break;
    }
    case 'n': {
      *write_to = '\n';
      break;
    }
    case 'r': {
      *write_to = '\r';
      break;
    }
    case 't': {
      *write_to = '\t';
      break;
    }
    case 'v': {
      *write_to = '\v';
      break;
    }

    case 'x': {
      *write_to = static_cast<char>(ReadHexNumber(str + 1, 2, true,
          nullptr, &ok));
      if (!ok) {
        THROW_EXCEPTION(SyntaxError, "Invalid hexadecimal escape sequence");
        return false;
      }
      *size = 3;
      break;
    }

    case 'u': {
      uint32_t symb_code = ReadUnicodeEscapeSequence(isolate,
                                                     str + 1,
                                                     size,
                                                     &ok);

      if (!ok) {
        return false;
      }
      CodePointToUtf8(symb_code, res_len, write_to);
      *size += 1;
      break;
    }

    case '0': {
      if (isdigit(str[1])) {
        THROW_EXCEPTION(SyntaxError,
            "Decimal digits after \\0 are not allowed in strings");
        return false;
      }
      *write_to = 0;
      break;
    }

    default: {
      if ('0' <= str[0] && str[0] <= '7') {
        THROW_EXCEPTION(SyntaxError,
            "Octal escape sequences are not allowed in strings");
        return false;
      }
      *write_to = str[0];
    }
  }

  return true;
}

// Parses a hexadecimal number with maximal length of max_len (if is_limited true)
// into uint32_t. Whether the parsing was successful is determined by the value
// of `ok`. Resulting size of the value will be outputted in len (if is_limited is
// false).
static uint32_t ReadHexNumber(const char* str,
                              size_t required_len,
                              bool is_limited,
                              size_t* len,
                              bool* ok) {
  static const int8_t xdigit_table[] = {
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, // '0' to '9'
    -1, -1, -1, -1, -1, -1, -1,   // 0x3A to 0x40
    10, 11, 12, 13, 14, 15,       // 'A' to 'F'
    // 'G' to 'Z':
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1,       // 0x5B to 0x60
    10, 11, 12, 13, 14, 15,       // 'a' to 'f'
  };

  uint32_t result = 0;
  uint64_t current_value = 0;
  size_t current_length = 0;
  char current_digit;

  *ok = true;

  while (isxdigit(str[current_length])) {
    current_digit = str[current_length];
    current_length++;
    current_value *= 16;
    current_value += xdigit_table[current_digit - '0'];
    if (current_value > UINT32_MAX) {
      *ok = false;
      return result;
    }
    result = current_value;
    if (is_limited && current_length == required_len) {
      break;
    }
  }

  if (is_limited) {
    if (current_length < required_len) {
      *ok = false;
    }
  } else {
    if (current_length == 0) {
      *ok = false;
    }
    *len = current_length;
  }

  return result;
}

MaybeLocal<String> ParseKeyInObject(Isolate*    isolate,
                                    const char* begin,
                                    const char* end,
                                    size_t*     size) {
  *size = end - begin;
  Local<String> result;
  if (begin[0] == '\'' || begin[0] == '"') {
    Type current_type;
    bool valid = GetType(begin, end, &current_type);
    if (valid && current_type == Type::kString) {
      size_t offset;
      MaybeLocal<Value> key = ParseString(isolate, begin, end, &offset);
      if (key.IsEmpty()) {
        return MaybeLocal<String>();
      }
      result = key.ToLocalChecked().As<String>();
      *size = offset;
      return result;
    } else {
      THROW_EXCEPTION(SyntaxError,
          "Invalid format in object: key is invalid string");
      return MaybeLocal<String>();
    }
  } else {
    size_t current_length = 0;
    size_t cp_size;
    uint32_t cp;
    bool ok;
    char* fallback = nullptr;
    size_t fallback_length;
    bool is_escape = false;
    while (current_length < *size) {
      if (begin[current_length] == '\\' &&
          begin[current_length + 1] == 'u') {
        cp = ReadUnicodeEscapeSequence(isolate, begin + current_length + 2,
                                       &cp_size, &ok);
        if (!ok) {
          return MaybeLocal<String>();
        }
        cp_size += 2;
        if (!fallback) {
          fallback = new char[*size + 1];
          memcpy(fallback, begin, current_length);
          fallback_length = current_length;
        }
        is_escape = true;
      } else {
        cp = Utf8ToCodePoint(begin + current_length, &cp_size);
        is_escape = false;
      }
      if (current_length == 0 ? IsIdStartCodePoint(cp) :
                                IsIdPartCodePoint(cp)) {
        if (fallback) {
          if (!is_escape) {
            memcpy(fallback + fallback_length, begin + current_length, cp_size);
            fallback_length += cp_size;
          } else {
            size_t fallback_cp_size;
            CodePointToUtf8(cp, &fallback_cp_size, fallback + fallback_length);
            fallback_length += fallback_cp_size;
          }
        }
        current_length += cp_size;
      } else {
        if (current_length != 0) {
          if (!fallback) {
            result = NewFromUtf8OrEmpty(isolate, begin,
                                        v8::NewStringType::kInternalized,
                                        static_cast<int>(current_length));
          } else {
            result = NewFromUtf8OrEmpty(isolate, fallback,
                                        v8::NewStringType::kInternalized,
                                        static_cast<int>(fallback_length));
          }
          break;
        } else {
          THROW_EXCEPTION(SyntaxError, "Unexpected identifier");
          return MaybeLocal<String>();
        }
      }
    }
    *size = current_length;
    return result;
  }
}

MaybeLocal<Value> ParseValueInObject(Isolate*    isolate,
                                     const char* begin,
                                     const char* end,
                                     size_t*     size) {
  Type current_type;
  bool valid = GetType(begin, end, &current_type);
  if (valid) {
    return (kParseFunctions[current_type])(isolate, begin, end, size);
  } else {
    THROW_EXCEPTION(TypeError, "Invalid type in object");
    return MaybeLocal<Value>();
  }
}

MaybeLocal<Value> ParseObject(Isolate*    isolate,
                              const char* begin,
                              const char* end,
                              size_t*     size) {
  bool key_mode = true;
  *size = end - begin;
  MaybeLocal<String> current_key;
  MaybeLocal<Value> current_numeric_key;
  MaybeLocal<Value> current_value;
  size_t current_length = 0;
  auto result = Object::New(isolate);
  bool has_ended = false;

  for (size_t i = 1; i < *size; i++) {
    if (key_mode) {
      i += SkipToNextToken(begin + i, end);
      if (begin[i] == '}') {
        *size = i + 1;
        has_ended = true;
        break;
      }
      if (!isdigit(begin[i])) {
        current_key = ParseKeyInObject(isolate, begin + i, end,
            &current_length);
      } else {
        current_numeric_key = ParseNumber(isolate, begin + i, end,
            &current_length);
        current_key = current_numeric_key.IsEmpty() ? MaybeLocal<String>() :
            current_numeric_key.ToLocalChecked()->ToString(
                isolate->GetCurrentContext());
      }
      if (current_key.IsEmpty()) {
        return MaybeLocal<Value>();
      }
      i += current_length;
      i += SkipToNextToken(begin + i, end);
      if (begin[i] != ':') {
        THROW_EXCEPTION(SyntaxError, "Unexpected token");
        return MaybeLocal<Value>();
      }
    } else {
      i += SkipToNextToken(begin + i, end);
      if (begin[i] == ',') {
        THROW_EXCEPTION(SyntaxError, "Value is missing in object");
        return MaybeLocal<Value>();
      }
      current_value = ParseValueInObject(isolate,
                                         begin + i,
                                         end,
                                         &current_length);
      if (current_value.IsEmpty()) {
        return current_value;
      }
      Local<Value> value = current_value.ToLocalChecked();
      if (!value->IsUndefined()) {
        Maybe<bool> is_ok = result->Set(isolate->GetCurrentContext(),
                                        current_key.ToLocalChecked(),
                                        value);
        if (is_ok.IsNothing()) {
          THROW_EXCEPTION(Error, "Cannot add property to object");
          return MaybeLocal<Value>();
        }
      }
      i += current_length;
      i += SkipToNextToken(begin + i, end);
      if (begin[i] != ',' && begin[i] != '}') {
        THROW_EXCEPTION(SyntaxError, "Invalid format in object");
        return MaybeLocal<Value>();
      } else if (begin[i] == '}') {
        *size = i + 1;
        has_ended = true;
        break;
      }
    }
    key_mode = !key_mode;
  }

  if (!has_ended) {
    THROW_EXCEPTION(SyntaxError, "Missing closing brace in object");
    return MaybeLocal<Value>();
  }

  return result;
}

MaybeLocal<Value> ParseArray(Isolate*    isolate,
                             const char* begin,
                             const char* end,
                             size_t*     size) {
  auto array = Array::New(isolate);
  size_t current_length = 0;
  *size = end - begin;

  bool is_empty = true;
  bool has_ended = false;

  size_t current_element = 0;
  Type current_type;

  for (size_t i = 1; i < *size; i++) {
    i += SkipToNextToken(begin + i, end);
    if (is_empty && begin[i] == ']') {  // In case of empty array
      *size = i + 1;
      return array;
    }

    bool valid = GetType(begin + i, end, &current_type);
    if (valid) {
      MaybeLocal<Value> t = kParseFunctions[current_type](isolate,
                                                          begin + i,
                                                          end,
                                                          &current_length);
      if (t.IsEmpty()) {
        return t;
      }
      if (!(current_type == Type::kUndefined && begin[i] == ']')) {
        Maybe<bool> is_ok = array->Set(isolate->GetCurrentContext(),
                                       static_cast<uint32_t>(current_element++),
                                       t.ToLocalChecked());
        if (is_ok.IsNothing()) {
          THROW_EXCEPTION(Error, "Cannot add element to array");
          return MaybeLocal<Value>();
        }
        is_empty = false;
      }

      i += current_length;
      i += SkipToNextToken(begin + i, end);

      current_length = 0;

      if (begin[i] != ',' && begin[i] != ']') {
        THROW_EXCEPTION(SyntaxError, "Invalid format in array: missed comma");
        return MaybeLocal<Value>();
      } else if (begin[i] == ']') {
        *size = i + 1;
        has_ended = true;
        break;
      }
    } else {
      THROW_EXCEPTION(TypeError, "Invalid type in array");
      return MaybeLocal<Value>();
    }
  }

  if (!has_ended) {
    THROW_EXCEPTION(SyntaxError, "Missing closing bracket in array");
    return MaybeLocal<Value>();
  }

  return array;
}

}  // namespace internal

}  // namespace parser

}  // namespace mdsf
