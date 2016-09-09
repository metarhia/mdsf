#ifndef JSRS_H_
#define JSRS_H_

#include <node.h>
#include <v8.h>

namespace jstp {

void Stringify(const v8::FunctionCallbackInfo<v8::Value>& args);
void Parse(const v8::FunctionCallbackInfo<v8::Value>& args);

}

#endif
