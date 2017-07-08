// Copyright (c) 2016-2017 JSTP project authors. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.
// Copyright (c) 2018 mdsf project authors. Use of this source code is
// governed by the MIT license that can be found in the LICENSE file.

#ifndef SRC_MESSAGE_PARSER_H_
#define SRC_MESSAGE_PARSER_H_

#include <cstddef>

#include <v8.h>

namespace mdsf {

namespace message_parser {

const char kMessageTerminator = '\0';

// Efficiently parses JSTP messages for transports that require message
// delimiters eliminating the need to split the stream data into parts before
// parsing and allowing to do that in one pass.
v8::Local<v8::String> ParseJSTPMessages(v8::Isolate* isolate,
    const char* str, std::size_t length, v8::Local<v8::Array> out);

}  // namespace message_parser

}  // namespace mdsf

#endif  // SRC_MESSAGE_PARSER_H_
