'use strict';

var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

var license = fs.readFileSync(path.join(__dirname, 'LICENSE')).toString();

module.exports = {
  entry: './jstp',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'jstp.min.js',
    sourceMapFilename: 'jstp.min.js.map',
    libraryTarget: 'assign',
    library: ['api', 'jstp']
  },
  devtool: 'source-map',
  node: {
    Buffer: true,
  },
  bail: true,
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        screw_ie8: true,  // eslint-disable-line camelcase
        warnings: false
      },
      mangle: {
        screw_ie8: true  // eslint-disable-line camelcase
      },
      output: {
        comments: false,
        screw_ie8: true  // eslint-disable-line camelcase
      }
    }),
    new webpack.BannerPlugin(license)
  ]
};
