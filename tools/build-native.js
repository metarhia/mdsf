#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

const EXIT_SUCCESS = 0;
const EXIT_FAIL = 1;

let action = process.argv.includes('--rebuild') ? 'rebuild' : 'build';
const jobs = `-j${process.env.JOBS || os.cpus().length}`;

function runCommand(name, args, callback) {
  const command = childProcess.spawn(name, args, { shell: true });
  const errorLines = [];

  command.on('error', () => {
    handleBuildError(EXIT_FAIL);
  });

  command.stdout.pipe(process.stdout);

  command.stderr.on('data', data => {
    const line = data.toString();
    console.error(line);
    errorLines.push(line);
  });

  command.on('exit', code => {
    if (errorLines.length > 0) {
      fs.writeFileSync('builderror.log', errorLines.join('\n'));
    }
    if (code !== EXIT_SUCCESS) {
      handleBuildError(code);
    }
    if (callback) {
      callback();
    }
  });
}

function handleBuildError(code) {
  if (process.env.CI) {
    process.exit(code);
  }
  console.warn(
    'Could not build mdsf native extensions, ' +
      'JavaScript implementation will be used instead.'
  );
  process.exit(EXIT_SUCCESS);
}

fs.access('build', error => {
  if (error) {
    action = 'rebuild';
  }

  const buildNative = () => runCommand('node-gyp', [action, jobs]);

  if (action === 'rebuild') {
    runCommand(
      `node ${path.join(__dirname, 'make-unicode-tables.js')}`,
      [],
      buildNative
    );
  } else {
    buildNative();
  }
});
