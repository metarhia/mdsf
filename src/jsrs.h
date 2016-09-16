// JSTP Record Serialization
//
// Copyright (c) 2016 Alexey Orlenko, Mykola Bilochub
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

#ifndef JSRS_H_
#define JSRS_H_

#include <node.h>
#include <v8.h>

namespace jstp {

namespace jsrs {

v8::Local<v8::String> Stringify(v8::Isolate* isolate,
    v8::Local<v8::Value> value);
v8::Local<v8::Value> Parse(v8::Isolate* isolate,
    const v8::String::Utf8Value& in);

namespace bindings {

void Stringify(const v8::FunctionCallbackInfo<v8::Value>& args);
void Parse(const v8::FunctionCallbackInfo<v8::Value>& args);

}  // namespace bindings

}  // namespace jsrs

}  // namespace jstp

#endif  // JSRS_H_
