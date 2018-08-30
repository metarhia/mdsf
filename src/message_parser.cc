// Copyright (c) 2016-2017 JSTP project authors. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.
// Copyright (c) 2018 mdsf project authors. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.

#include "message_parser.h"

#include <cstddef>
#include <cstring>

#include <v8.h>

#include "common.h"
#include "parser.h"

using std::size_t;
using std::strlen;

using v8::Array;
using v8::Isolate;
using v8::Local;
using v8::String;

using mdsf::parser::internal::ParseObject;
using mdsf::parser::internal::SkipToNextToken;

namespace mdsf {

namespace message_parser {

Local<String> ParseJSTPMessages(Isolate* isolate,
                                const char* str,
                                size_t length,
                                Local<Array> out) {
  auto context = isolate->GetCurrentContext();
  uint32_t out_index = 0;
  int32_t parsed_length = 0;

  for (size_t i = 0; i < length; i++) {
    if (str[i] != kMessageTerminator) {
      continue;
    }
    const char* current_message = str + parsed_length;
    const char* current_message_end = str + i;
    size_t skipped_size = SkipToNextToken(current_message, current_message_end);
    size_t parsed_message_size = 0;
    if (current_message[skipped_size] != '{') {
      THROW_EXCEPTION(SyntaxError, "Invalid message type");
      return Local<String>();
    }
    auto message_object = ParseObject(isolate,
                                      current_message + skipped_size,
                                      current_message_end,
                                      &parsed_message_size);

    if (message_object.IsEmpty()) {
      return Local<String>();
    }

    parsed_message_size += skipped_size;
    parsed_message_size += SkipToNextToken(
        current_message + parsed_message_size, current_message_end);

    if (parsed_message_size != i - parsed_length) {
      THROW_EXCEPTION(SyntaxError, "Invalid format");
      return Local<String>();
    }

    auto mb = out->Set(context, out_index++, message_object.ToLocalChecked());
    if (!mb.FromMaybe(false)) {
      return Local<String>();
    }

    parsed_length = i + 1;
  }

  return String::NewFromUtf8(isolate, str + parsed_length);
}

}  // namespace message_parser

}  // namespace mdsf
