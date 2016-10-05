'use strict';

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: [
      'mocha',
      'expect',
      'detectBrowsers'
    ],
    files: [
      'browser/jstp-serializer.js',
      'tests/serializer.test.js'
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
        if (process.env.TRAVIS) {
          return browsers.filter(function(browser) {
            return !browser.startsWith('Chrome');
          });
        }
        return browsers;
      }
    },
    singleRun: true,
    concurrency: Infinity
  });
};
