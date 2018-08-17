#!/usr/bin/env node

// Prints an environment variable value in a cross-platform manner for use in
// shell scripts and binding.gyp.  The main problem with using `echo $VAR` or
// `echo %VAR%` conditionally is that the behavior of echo differs on Unix and
// Windows when the variable is not set.

'use strict';

const variable = process.argv[2];

if (!variable) {
  console.error('Usage: ./tools/echo-env VARIABLE_NAME');
  process.exit(1);
}

console.log(process.env[variable] || '');
