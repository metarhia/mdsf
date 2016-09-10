#ifndef JSRS_H_
#define JSRS_H_

#include <node.h>
#include <v8.h>

namespace jstp {

void Stringify(const v8::FunctionCallbackInfo<v8::Value>& args);
void Parse(const v8::FunctionCallbackInfo<v8::Value>& args);

namespace stringifiers {

v8::Local<v8::String> StringifyImpl(v8::Isolate* isolate,
    v8::Local<v8::Value> value, bool isRootValue);
v8::Local<v8::String> StringifyNumber(v8::Isolate* isolate,
    v8::Local<v8::Number> number);
v8::Local<v8::String> StringifyBoolean(v8::Isolate* isolate,
    v8::Local<v8::Boolean> boolean);
v8::Local<v8::String> StringifyUndefined(v8::Isolate* isolate,
    bool isRootValue);
v8::Local<v8::String> StringifyDate(v8::Isolate* isolate,
    v8::Local<v8::Date> date);
v8::Local<v8::String> StringifyArray(v8::Isolate* isolate,
    v8::Local<v8::Array> array);

}  // namespace stringifiers

}  // namespace jstp

#endif
