'use strict';

const fs = require('fs');
const childProcess = require('child_process');

const isWindows = process.platform === 'win32';
const nodeMajorVersion = parseInt(process.versions.node.split('.')[0]);

if (isWindows || nodeMajorVersion < 4) {
  console.warn('Unfortunately JSTP native extensions are not available ' +
    'on your platform. Pure JavaScript implementation will be used instead.');
  process.exit();
}

const nodeGyp = childProcess.spawn('node-gyp', ['rebuild']);
const errorLines = [];

nodeGyp.stdout.pipe(process.stdout);

nodeGyp.stderr.on('data', (data) => {
  const line = data.toString();
  console.error(line);
  errorLines.push(line);
});

nodeGyp.on('exit', (code) => {
  if (errorLines.length > 0) {
    fs.writeFileSync('builderror.log', errorLines.join('\n'));
  }
  process.exit(code);
});
