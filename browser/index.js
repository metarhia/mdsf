'use strict';

var common = require('../lib/common');

var jstp = {};
module.exports = jstp;

loadPlugins(['jsrs']);

function loadPlugins(plugins) {
  var loadedPlugins = plugins.map(function(plugin) {
    return require('./' + plugin);
  });
  var args = [jstp].concat(loadedPlugins);
  common.extend.apply(null, args);
}
