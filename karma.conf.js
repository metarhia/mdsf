'use strict';

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: [
      'mocha',
      'expect',
      'sinon',
      'detectBrowsers'
    ],
    files: [
      'dist/jstp.min.js',
      'tests/serializer.test.js',
      'tests/remote-error.test.js',
      'tests/remote-proxy.test.js',
      'tests/connection.test.js'
    ],
    exclude: [],
    preprocessors: {},
    reporters: ['dots'],
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
    singleRun: true,
    concurrency: Infinity
  });
};
