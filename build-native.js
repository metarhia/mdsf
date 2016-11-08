'use strict';

var fs = require('fs');
var childProcess = require('child_process');

var isWindows = process.platform === 'win32';
var nodeMajorVersion = parseInt(process.versions.node.split('.')[0]);

if (isWindows || nodeMajorVersion < 4) {
  console.warn('Unfortunately JSTP native extensions are not available ' +
    'on your platform. Pure JavaScript implementation will be used instead.');
  process.exit();
}

var nodeGyp = childProcess.spawn('node-gyp', ['rebuild']);
var errorLines = [];

nodeGyp.stdout.pipe(process.stdout);

nodeGyp.stderr.on('data', function(data) {
  var line = data.toString();

  console.error(line);
  errorLines.push(line);
});

nodeGyp.on('exit', function(code) {
  if (errorLines.length > 0) {
    fs.writeFileSync('builderror.log', errorLines.join('\n'));
  }

  process.exit(code);
});
