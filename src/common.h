// Copyright (c) 2016-2017 JSTP project authors. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.

#ifndef SRC_COMMON_H_
#define SRC_COMMON_H_

#include <v8.h>

#define THROW_EXCEPTION(ex_type, ex_msg)                                       \
  isolate->ThrowException(v8::Exception::ex_type(                              \
      NewFromUtf8OrEmpty(isolate, ex_msg)))

inline v8::Local<v8::String> NewFromUtf8OrEmpty(
    v8::Isolate *isolate,
    const char *data,
    v8::NewStringType type = v8::NewStringType::kNormal,
    int length = -1) {
  return v8::String::NewFromUtf8(isolate, data, type, length)
      .FromMaybe(v8::String::Empty(isolate));
}

#endif  // SRC_COMMON_H_
