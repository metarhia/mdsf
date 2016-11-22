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

// Serializes a JavaScript value using the JSTP Record Serialization format
// and returns a string representing it.
v8::Local<v8::String> Stringify(v8::Isolate* isolate,
    v8::Local<v8::Value> value);

// Deserializes a UTF-8 encoded string in the JSTP Record Serialization format
// into a JavaScript value and returns a handle to it.
v8::Local<v8::Value> Parse(v8::Isolate* isolate,
    const v8::String::Utf8Value& in);

// Efficiently parses JSTP packets for transports that require packet
// delimiters eliminating the need to split the stream data into parts before
// parsing and allowing to do that in one pass.
v8::Local<v8::String> ParseNetworkPackets(v8::Isolate* isolate,
    const v8::String::Utf8Value& in, v8::Local<v8::Array> out);

namespace bindings {

// JavaScript binding to jstp::jsrs::Stringify.
void Stringify(const v8::FunctionCallbackInfo<v8::Value>& args);

// JavaScript binding to jstp::jsrs::Parse.
void Parse(const v8::FunctionCallbackInfo<v8::Value>& args);

// JavaScript binding to jstp::jsrs::ParseNetworkPackets.
void ParseNetworkPackets(const v8::FunctionCallbackInfo<v8::Value>& args);

}  // namespace bindings

}  // namespace jsrs

}  // namespace jstp

#endif  // JSRS_H_
