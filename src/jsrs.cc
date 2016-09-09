#include <node.h>
#include <v8.h>

namespace jstp {

void Stringify(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope scope(isolate);
  args.GetReturnValue().Set(v8::String::NewFromUtf8(isolate, "string"));
}

void Parse(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope scope(isolate);
  args.GetReturnValue().Set(v8::String::NewFromUtf8(isolate, "object"));
}

}

void init(v8::Local<v8::Object> target) {
  NODE_SET_METHOD(target, "stringify", jstp::Stringify);
  NODE_SET_METHOD(target, "parse", jstp::Parse);
}

NODE_MODULE(jsrs, init);
