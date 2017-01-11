'use strict';

const browsers = process.env.TRAVIS ?
  ['Firefox'] :
  ['Chrome', 'ChromeCanary', 'Firefox'];

if (process.platform === 'darwin') {
  browsers.push('Safari');
}

module.exports = (config) => {
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
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers,
    webpack: {},
    webpackMiddleware: {
      stats: 'errors-only'
    },
    singleRun: true,
    concurrency: Infinity
  });
};
