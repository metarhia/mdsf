#include "jsrs.h"

#include <cstdio>
#include <cctype>
#include <clocale>
#include <cstring>
#include <cstdlib>
#include <cstdio>

namespace jstp {

void Stringify(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();

  if (args.Length() != 1) {
    isolate->ThrowException(v8::Exception::TypeError(
        v8::String::NewFromUtf8(isolate, "Wrong number of arguments")));
    return;
  }

  v8::HandleScope scope(isolate);

  v8::Local<v8::String> result =
    stringifiers::StringifyImpl(isolate, args[0], true);
  args.GetReturnValue().Set(result);
}

namespace stringifiers {

v8::Local<v8::String> StringifyNumber(v8::Isolate* isolate,
    v8::Local<v8::Number> number) {
  double value = number->Value();
  char buffer[256] = { 0 };
  std::sprintf(buffer, "%g", value);
  return v8::String::NewFromUtf8(isolate, buffer);
}

v8::Local<v8::String> StringifyBoolean(v8::Isolate* isolate,
    v8::Local<v8::Boolean> boolean) {
  bool value = boolean->Value();
  const char* string = value ? "true" : "false";
  return v8::String::NewFromUtf8(isolate, string);
}

v8::Local<v8::String> StringifyUndefined(v8::Isolate* isolate,
    bool isRootValue) {
  const char* string = isRootValue ? "undefined" : "";
  return v8::String::NewFromUtf8(isolate, string);
}

v8::Local<v8::String> StringifyDate(v8::Isolate* isolate,
    v8::Local<v8::Date> date) {
  return v8::String::NewFromUtf8(isolate, "new Date('TODO')");
}

v8::Local<v8::String> StringifyArray(v8::Isolate* isolate,
    v8::Local<v8::Array> array) {
  v8::Local<v8::String> comma =
    v8::String::NewFromUtf8(isolate, ",");

  v8::Local<v8::String> result =
    v8::String::NewFromUtf8(isolate, "[");

  uint32_t length = array->Length();

  for (uint32_t index = 0; index < length; index++) {
    v8::Local<v8::Value> value = array->Get(index);
    v8::Local<v8::String> chunk = StringifyImpl(isolate, value, false);

    result = v8::String::Concat(result, chunk);
    if (index != length - 1) {
      result = v8::String::Concat(result, comma);
    }
  }

  result = v8::String::Concat(result,
      v8::String::NewFromUtf8(isolate, "]"));

  return result;
}

v8::Local<v8::String> StringifyImpl(v8::Isolate* isolate,
    v8::Local<v8::Value> value, bool isRootValue) {
  if (value->IsNumber()) {
    return StringifyNumber(isolate, value->ToNumber(isolate));
  } else if (value->IsBoolean()) {
    return StringifyBoolean(isolate, value->ToBoolean(isolate));
  } else if (value->IsUndefined()) {
    return StringifyUndefined(isolate, isRootValue);
  } else if (value->IsNull()) {
    return v8::String::NewFromUtf8(isolate, "null");
  } else if (value->IsDate()) {
    return StringifyDate(isolate, value.As<v8::Date>());
  } else if (value->IsArray()) {
    return StringifyArray(isolate, value.As<v8::Array>());
  } else {
    return v8::String::Empty(isolate);
  }
}

}  // namespace stringifiers

namespace parsing {

enum Type {
  kUndefined = 0, kNull, kBool, kNumber, kString, kArray, kObject, kDate
};

const char* prepare_string(const char* str, int length) {
  char* result = new char[length + 1];
  bool string_mode = false;
  enum { kDisabled = 0, kOneline, kMultiline } comment_mode = kDisabled;
  std::size_t j = 0;
  for (std::size_t i = 0; i < length; ++i) {
    if ((str[i] == '\"' || str[i] == '\'') && (i == 0 || str[i - 1] != '\\')) {
      string_mode = !string_mode;
    }
    if (!string_mode) {
      if (!comment_mode && str[i] == '/') {
        switch (str[i + 1]) {
          case '/':
            comment_mode = kOneline;
            break;
          case '*':
            comment_mode = kMultiline;
            break;
        }
      }
      if (!comment_mode && !std::isspace(str[i])) {
        result[j++] = str[i];
      }
      if ((comment_mode == kOneline && (str[i] == '\n' || str[i] == '\r')) ||
          (comment_mode == kMultiline && str[i - 1] == '*' && str[i] == '/')) {
        comment_mode = kDisabled;
      }
    } else {
      result[j++] = str[i];
    }

  }
  result[j] = '\0';
  return result;
}

bool get_type(const char *begin, const char *end, Type &type) {
  bool result = true;
  switch (*begin) {
    case ',':
    case ']':
      type = Type::kUndefined;
      break;
    case '{':
      type = Type::kObject;
      break;
    case '[':
      type = Type::kArray;
      break;
    case '\"':
    case '\'':
      type = Type::kString;
      break;
    case 't':
    case 'f':
      type = Type::kBool;
      break;
    case 'n':
      type = Type::kNull;
      if (begin + 4 <= end) {
        result = (std::strncmp(begin, "null", 4) == 0);
      }
      break;
    case 'u':
      type = Type::kUndefined;
      if (begin + 9 <= end) {
        result = (std::strncmp(begin, "undefined", 9) == 0);
      }
      break;
    default:
      result = false;
      if (isdigit(*begin) || *begin == '.' || *begin == '+' || *begin == '-') {
        type = Type::kNumber;
        result = true;
      }
  }
  return result;
}

// Parse functions
v8::Local<v8::Value> parse_undefined(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size);
v8::Local<v8::Value> parse_null(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size);
v8::Local<v8::Value> parse_bool(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size);
v8::Local<v8::Value> parse_number(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size);
v8::Local<v8::Value> parse_string(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size);
v8::Local<v8::Value> parse_array(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size);
v8::Local<v8::Value> parse_object(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size);

const std::size_t kMaxKeyLength = 256;

v8::Local<v8::Value> (*parse_func[])(v8::Isolate*, const char *, const char *, std::size_t &) =
    {&parse_undefined, &parse_null, &parse_bool, &parse_number, &parse_string, &parse_array, &parse_object};

v8::Local<v8::Value> parse_undefined(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size) {
  if (*begin == ',' || *begin == ']') {
    size = 0;
  } else if (*begin == 'u') {
    size = 9;
  } else {
    isolate->ThrowException(v8::Exception::TypeError(
    v8::String::NewFromUtf8(isolate, "Invalid format of undefined value")));
  }
  return v8::Undefined(isolate);
}

v8::Local<v8::Value> parse_null(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size) {
  size = 4;
  return v8::Null(isolate);
}

v8::Local<v8::Value> parse_bool(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size) {
  v8::Local<v8::Value> result;
  if (begin + 4 <= end && strncmp(begin, "true", 4) == 0) {
    result = v8::True(isolate);
    size = 4;
  } else if (begin + 5 <= end && strncmp(begin, "false", 5) == 0) {
    result = v8::False(isolate);
    size = 5;
  } else {
    isolate->ThrowException(v8::Exception::TypeError(
    v8::String::NewFromUtf8(isolate, "Invalid format: expected boolean")));
    result = v8::Undefined(isolate);
  }
  return result;
}

v8::Local<v8::Value> parse_number(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size) {
  v8::Local<v8::Number> result = v8::Number::New(isolate, std::atof(begin));
  size = end - begin;
  std::size_t i = 0;
  while (begin[i] != ',' && begin[i] != '}' && begin[i] != ']' && i < size) i++;
  size = i;
  return result;
}

char* codePointsToUtf8(unsigned int c, std::size_t& size) {
  setlocale(LC_ALL, "en_US.utf8");
  char* b = new char[MB_CUR_MAX];
  if (c < 0x80) {
    *b++ = c;
    size = 1;
  } else if (c < 0x800) {
    *b++ = 192 + c / 64;
    *b++ = 128 + c % 64;
    size = 2;
  } else if (c-0xd800u<0x800) {
    delete []b;
    return nullptr;
  } else if (c<0x10000) {
     *b++ = 224 + c / 4096;
     *b++ = 128 + c / 64 % 64;
     *b++ = 128 + c % 64;
     size = 3;
  } else if (c < 0x110000) {
     *b++=240+c/262144;
     *b++=128+c/4096%64;
     *b++=128+c/64%64;
     *b++=128+c%64;
     size = 4;
  } else {
    delete []b;
    return nullptr;
  }
  return b;
}

unsigned int readHexNumber(const char* str, int len, bool& ok) {
  char t[5];
  char* end;
  std::strncpy(t, str, len);
  t[len] = '\0';
  unsigned int result = std::strtol(t, &end, 16);
  if (end - t != len) {
    ok = false;
  } else {
    ok = true;
  }
  return result;
}

char* getControlChar(v8::Isolate* isolate, const char* str, std::size_t& res_len, std::size_t& size) {
  setlocale(LC_ALL, "en_US.utf8");
  char* result = new char[MB_CUR_MAX];
  size = 1;
  res_len = 1;
  bool ok;
  switch (str[0]) {
    case 'a': *result = '\a'; break;
    case 'b': *result = '\b'; break;
    case 'f': *result = '\f'; break;
    case 'n': *result = '\n'; break;
    case 'r': *result = '\r'; break;
    case 't': *result = '\t'; break;
    case 'v': *result = '\v'; break;
    case '0': *result = '\0'; break;
    case '\\': *result = '\\'; break;
    case '\'': *result = '\''; break;
    case '"': *result = '"'; break;
    case 'x': {
      *result = readHexNumber(str + 1, 2, ok);
      if (!ok) {
        isolate->ThrowException(v8::Exception::SyntaxError(
        v8::String::NewFromUtf8(isolate, "Invalid hexadecimal escape sequence")));
        return nullptr;
      }
      size = 3;
      break;
    }
    case 'u': {
      unsigned int symbCode = readHexNumber(str + 1, 4, ok);
      if (!ok) {
        isolate->ThrowException(v8::Exception::SyntaxError(
        v8::String::NewFromUtf8(isolate, "Invalid Unicode escape sequence")));
        return nullptr;
      }
      char* unicodeSymbol = codePointsToUtf8(symbCode, res_len);
      if (!unicodeSymbol) {
        isolate->ThrowException(v8::Exception::SyntaxError(
        v8::String::NewFromUtf8(isolate, "Unknown Unicode symbol")));
        return nullptr;
      }
      size = 5;
      delete []result;
      return unicodeSymbol;
    }
    default:
      isolate->ThrowException(v8::Exception::SyntaxError(
      v8::String::NewFromUtf8(isolate, "Invalid string format")));
      return nullptr;
  }

  return result;
}

v8::Local<v8::Value> parse_string(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size) {
  size = end - begin;
  char* result = new char[size + 1];
  std::memset(result, 0, size + 1);
  enum { kApostrophe = 0, kQMarks} string_mode = (*begin == '\'') ? kApostrophe : kQMarks;
  bool is_ended = false;
  std::size_t j = 0;
  std::size_t out_offset, in_offset;
  for (std::size_t i = 1; i < size; ++i) {
    if ((string_mode == kQMarks && begin[i] == '\"') || (string_mode == kApostrophe && begin[i] == '\'') && begin[i - 1] != '\\') {
      is_ended = true;
      size = i + 1;
      result[i] = '\0';
      break;
    }
    if (begin[i] == '\\') {
      char* symb = getControlChar(isolate, begin + ++i, out_offset, in_offset);
      if (!symb) {
        return v8::String::Empty(isolate);
      }
      std::strncpy(result + j, symb, out_offset);
      delete []symb;
      i += in_offset;
      j += out_offset + 1;
    } else {
      result[j++] = begin[i];
    }
  }
  if (!is_ended) {
    isolate->ThrowException(v8::Exception::SyntaxError(
    v8::String::NewFromUtf8(isolate, "Error while parsing string")));
    return v8::String::Empty(isolate);
  }
  return v8::String::NewFromUtf8(isolate, result);
}

v8::Local<v8::Value> parse_object(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size) {
  bool key_mode = true;
  size = end - begin;
  char current_key[kMaxKeyLength];
  std::size_t current_length = 0;
  Type current_type;
  v8::Local<v8::Object> object = v8::Object::New(isolate);
  v8::Local<v8::Value> t;
  for (std::size_t i = 1; i < size; ++i) {
    if (key_mode) {
      if (begin[i] == ':') {
        key_mode = false;
        strncpy(current_key, begin + i - current_length, current_length);
        current_key[current_length] = '\0';
        current_length = 0;
      } else if (isalnum(begin[i]) || begin[i] == '_') {
        current_length++;
      } else if (begin[i] == '}') {
        return object; // In case of empty object
      } else {
        isolate->ThrowException(v8::Exception::SyntaxError(
        v8::String::NewFromUtf8(isolate, "Invalid format in object: key is invalid")));
        return v8::Object::New(isolate);
      }
    } else {
      bool valid = get_type(begin + i, end, current_type);
      if (valid) {
        t = (parse_func[current_type])(isolate, begin + i, end, current_length);
        object->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, current_key), t);
        i += current_length;
        if (begin[i] != ',' && begin[i] != '}') {
          isolate->ThrowException(v8::Exception::SyntaxError(
          v8::String::NewFromUtf8(isolate, "Invalid format in object: missed semicolon")));
          return v8::Object::New(isolate);
        } else if (begin[i] == '}') {
          size = i + 1;
          break;
        }
        current_key[0] = '\0';
        current_length = 0;
        key_mode = true;
      } else {
        isolate->ThrowException(v8::Exception::SyntaxError(
        v8::String::NewFromUtf8(isolate, "Invalid format in object")));
        return v8::Object::New(isolate);
      }
    }
  }
  return object;
}

v8::Local<v8::Value> parse_array(v8::Isolate* isolate, const char *begin, const char *end, std::size_t &size) {
  Type current_type;
  v8::Local<v8::Array> array = v8::Array::New(isolate);
  std::size_t current_length = 0;
  size = end - begin;
  if (*begin == '[' && *(begin + 1) == ']') { // In case of empty array
    return array;
  }
  v8::Local<v8::Value> t;
  std::size_t current_element = 0;
  for (std::size_t i = 1; i < size; ++i) {
    bool valid = get_type(begin + i, end, current_type);
    if (valid) {
      t = (parse_func[current_type])(isolate, begin + i, end, current_length);
      array->Set(current_element++, t);
      i += current_length;
      current_length = 0;
      if (begin[i] != ',' && begin[i] != ']') {
        isolate->ThrowException(v8::Exception::SyntaxError(
        v8::String::NewFromUtf8(isolate, "Invalid format in array: missed semicolon")));
        return v8::Array::New(isolate);
      } else if (begin[i] == ']') {
        size = i + 1;
        break;
      }
    } else {
      isolate->ThrowException(v8::Exception::SyntaxError(
      v8::String::NewFromUtf8(isolate, "Invalid format in array")));
      return v8::Array::New(isolate);
    }
  }

  return array;
}

v8::Local<v8::Value> parse(v8::Isolate* isolate, v8::String::Utf8Value &in) {
  const char *to_parse = prepare_string(*in, in.length());
  Type type;
  std::size_t size = strlen(to_parse);
  if (!get_type(to_parse, to_parse + size, type)) {
    isolate->ThrowException(v8::Exception::SyntaxError(
        v8::String::NewFromUtf8(isolate, "Invalid type")));
    return v8::Undefined(isolate);
  }
  v8::Local<v8::Value> result = (parse_func[type])(isolate, to_parse, to_parse + size, size);
  if (size != strlen(to_parse)) {
    isolate->ThrowException(v8::Exception::SyntaxError(
        v8::String::NewFromUtf8(isolate, "Invalid format")));
    return v8::Undefined(isolate);
  }
  delete[] to_parse;
  return result;
}

}

void Parse(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();

  if (args.Length() != 1) {
    isolate->ThrowException(v8::Exception::TypeError(
        v8::String::NewFromUtf8(isolate, "Wrong number of arguments")));
    return;
  }
  if (!args[0]->IsString()) {
    isolate->ThrowException(v8::Exception::TypeError(
        v8::String::NewFromUtf8(isolate, "Wrong argument type")));
    return;
  }

  v8::HandleScope scope(isolate);

  v8::String::Utf8Value str(args[0]->ToString());

  v8::Local<v8::Value> result = parsing::parse(isolate, str);
  args.GetReturnValue().Set(result);
}

}  // namespace jstp

namespace {

void init(v8::Local<v8::Object> target) {
  NODE_SET_METHOD(target, "stringify", jstp::Stringify);
  NODE_SET_METHOD(target, "parse", jstp::Parse);
}

NODE_MODULE(jsrs, init);

}  // namespace
