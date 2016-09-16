/*
 * JSTP Record Serialization
 *
 * Copyright (c) 2016 Mykola Bilochub, Alexey Orlenko
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 * The code in this file is based upon the C++ implementation of JSTP parser
 * and serializer originating from `https://github.com/NechaiDO/JSTP-cpp`.
 * Original license:
 *
 * Copyright (c) 2016 Dmytro Nechai, Nikolai Belochub
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

#ifndef JSRS_IMPL_H_
#define JSRS_IMPL_H_

#include <cstddef>

#include <node.h>
#include <v8.h>

namespace jstp {

namespace jsrs {

namespace serializer {

v8::Local<v8::String> StringifyImpl(v8::Isolate* isolate,
    v8::Local<v8::Value> value);
v8::Local<v8::String> StringifyDate(v8::Isolate* isolate,
    v8::Local<v8::Date> date);
v8::Local<v8::String> StringifyString(v8::Isolate* isolate,
    v8::Local<v8::String> string);
v8::Local<v8::String> StringifyArray(v8::Isolate* isolate,
    v8::Local<v8::Array> array);
v8::Local<v8::String> StringifyObject(v8::Isolate* isolate,
    v8::Local<v8::Object> object);
v8::Local<v8::String> StringifyKey(v8::Isolate* isolate,
    v8::Local<v8::String> key);

bool IsValidKey(v8::Isolate* isolate, const v8::String::Utf8Value& key);
const char* GetEscapedControlChar(char str, std::size_t* size);

}  // namespace serializer

namespace deserializer {

enum Type {
  kUndefined = 0, kNull, kBool, kNumber, kString, kArray, kObject, kDate
};

v8::Local<v8::Value> ParseUndefined(v8::Isolate* isolate, const char* begin,
    const char* end, std::size_t* size);
v8::Local<v8::Value> ParseNull(v8::Isolate* isolate, const char* begin,
    const char* end, std::size_t* size);
v8::Local<v8::Value> ParseBool(v8::Isolate* isolate, const char* begin,
    const char* end, std::size_t* size);
v8::Local<v8::Value> ParseNumber(v8::Isolate* isolate, const char* begin,
    const char* end, std::size_t* size);
v8::Local<v8::Value> ParseString(v8::Isolate* isolate, const char* begin,
    const char* end, std::size_t* size);
v8::Local<v8::Value> ParseArray(v8::Isolate* isolate, const char* begin,
    const char* end, std::size_t* size);
v8::Local<v8::Value> ParseObject(v8::Isolate* isolate, const char* begin,
    const char* end, std::size_t* size);

constexpr static v8::Local<v8::Value> (*kParseFunctions[])(v8::Isolate*,
    const char *, const char *, std::size_t *) = {
  &ParseUndefined,
  &ParseNull,
  &ParseBool,
  &ParseNumber,
  &ParseString,
  &ParseArray,
  &ParseObject
};

static const std::size_t kMaxKeyLength = 256;

const char* PrepareString(const char* str, std::size_t length);
bool GetType(const char* begin, const char* end, Type* type);
char* CodePointsToUtf8(unsigned int c, std::size_t* size);
unsigned int ReadHexNumber(const char* str, int len, bool* ok);
char* GetControlChar(v8::Isolate* isolate, const char* str,
                     std::size_t* res_len, std::size_t* size);
v8::Local<v8::Value> ParseImpl(v8::Isolate* isolate,
                           const v8::String::Utf8Value& in);

}  // namespace deserializer

}  // namespace jsrs

}  // namespace jstp

#endif  // JSRS_IMPL_H_
