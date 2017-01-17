'use strict';

const fs = require('fs');
const childProcess = require('child_process');

const nodeGyp = childProcess.spawn('node-gyp', ['rebuild'], { shell: true });

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
  if (code !== 0) {
    console.warn('Could not build JSTP native extensions, ' +
      'JavaScript implementation will be used instead.');
  }
  process.exit();
});
