#include "jsrs.h"

#include <cstdio>

namespace jstp {

void Stringify(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();

  if (args.Length() != 1) {
    isolate->ThrowException(v8::Exception::TypeError(
        v8::String::NewFromUtf8(isolate, "Wrong number of arguments")));
    return;
  }

  v8::Local<v8::String> result = stringifiers::StringifyImpl(isolate, args[0]);
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

v8::Local<v8::String> StringifyImpl(v8::Isolate* isolate,
    v8::Local<v8::Value> value) {
  if (value->IsNumber()) {
    return StringifyNumber(isolate, value->ToNumber(isolate));
  }
  if (value->IsBoolean()) {
    return StringifyBoolean(isolate, value->ToBoolean(isolate));
  }
}

}  // namespace stringifiers

void Parse(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope scope(isolate);
  args.GetReturnValue().Set(v8::String::NewFromUtf8(isolate, "object"));
}

}  // namespace jstp

namespace {

void init(v8::Local<v8::Object> target) {
  NODE_SET_METHOD(target, "stringify", jstp::Stringify);
  NODE_SET_METHOD(target, "parse", jstp::Parse);
}

NODE_MODULE(jsrs, init);

}  // namespace
