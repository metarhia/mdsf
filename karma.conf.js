'use strict';

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: [
      'mocha',
      'detectBrowsers'
    ],
    files: [
      { pattern: 'test/*.test.js', watched: false },
      { pattern: 'test/**/*.test.js', watched: false }
    ],
    exclude: [],
    preprocessors: {
      'test/*.test.js': ['webpack'],
      'test/**/*.test.js': ['webpack']
    },
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: [
      'Chrome',
      'ChromeCanary',
      'Firefox',
      'Safari'
    ],
    detectBrowsers: {
      enabled: true,
      usePhantomJS: false,
      postDetection: function(browsers) {
        return process.env.TRAVIS ?
          ['Firefox'] :
          browsers;
      }
    },
    webpack: { },
    webpackMiddleware: {
      stats: 'errors-only'
    },
    singleRun: true,
    concurrency: Infinity
  });
};
