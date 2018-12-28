// Copyright (c) 2016-2017 JSTP project authors. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.
// Copyright (c) 2018 mdsf project authors. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.

#include <node.h>
#include <v8.h>

#include "common.h"
#include "parser.h"
#include "message_parser.h"

using v8::Array;
using v8::FunctionCallbackInfo;
using v8::HandleScope;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;
using v8::Uint8Array;

namespace mdsf {

namespace bindings {

void Parse(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.Length() != 1) {
    THROW_EXCEPTION(TypeError, "Wrong number of arguments");
    return;
  }

  HandleScope scope(isolate);

  Local<Value> result;
  std::size_t length;

  if (args[0]->IsString()) {
    String::Utf8Value str(
#if NODE_MODULE_VERSION >= 57
        isolate,
#endif
        args[0]
    );
    length = str.length();
    result = mdsf::parser::Parse(isolate, *str, length);
  } else if (args[0]->IsUint8Array()) {
    Local<Uint8Array> buf = args[0].As<Uint8Array>();
    length = buf->ByteLength();
    void* data = buf->Buffer()->GetContents().Data();
    const char* str = static_cast<const char*>(data) + buf->ByteOffset();
    result = mdsf::parser::Parse(isolate, str, length);
  } else {
    THROW_EXCEPTION(TypeError, "Wrong argument type");
    return;
  }

  args.GetReturnValue().Set(result);
}

void ParseJSTPMessages(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.Length() != 2) {
    THROW_EXCEPTION(TypeError, "Wrong number of arguments");
    return;
  }
  if (!args[0]->IsString() || !args[1]->IsArray()) {
    THROW_EXCEPTION(TypeError, "Wrong argument type");
    return;
  }

  HandleScope scope(isolate);

  String::Utf8Value str(
#if NODE_MODULE_VERSION >= 57
      isolate,
#endif
      args[0].As<String>()
  );
  std::size_t length = str.length();
  auto array = args[1].As<Array>();
  auto result = mdsf::message_parser::ParseJSTPMessages(isolate, *str, length,
                                                        array);
  args.GetReturnValue().Set(result);
}

void Init(Local<Object> target) {
  NODE_SET_METHOD(target, "parse", Parse);
  NODE_SET_METHOD(target, "parseJSTPMessages", ParseJSTPMessages);
}

NODE_MODULE(mdsf, Init);

}  // namespace bindings

}  // namespace mdsf
