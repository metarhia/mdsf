'use strict';

var browsers = process.env.TRAVIS ?
  ['Firefox'] :
  ['Chrome', 'ChromeCanary', 'Firefox'];

if (process.platform === 'darwin') {
  browsers.push('Safari');
}

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha'],
    files: [
      { pattern: 'test/unit/*.test.js', watched: false },
      { pattern: 'test/unit/**/*.test.js', watched: false }
    ],
    exclude: [],
    preprocessors: {
      'test/unit/*.test.js': ['webpack'],
      'test/unit/**/*.test.js': ['webpack']
    },
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: browsers,
    webpack: {},
    webpackMiddleware: {
      stats: 'errors-only'
    },
    singleRun: true,
    concurrency: Infinity
  });
};
