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
