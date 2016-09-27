var path = require('path');
var fs = require('fs');

if (!process.env.BACKEND_URL) {
  throw new Error(`
Please run the following before running webpack:

$ export BACKEND_URL=<something>

<something> is one of:
1. https://api.beeline.sg (LIVE)
2. https://beeline-server-dev.herokuapp.com (STAGING)
3. http://staging.beeline.sg
`)
}

var env = {
    BACKEND_URL: process.env.BACKEND_URL,
}
fs.writeFileSync(`${__dirname}/beeline/env.json`, JSON.stringify(env))

module.exports = {
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.html$/,
        loader: 'html',
        exclude: /node_modules/,
        include: path.resolve('.'),
        query: {
          attrs: false, /* disable img:src loading */
        }
      },
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
        include: path.resolve('.'),
      },
      {
        test: /\.json$/,
        loader: 'json',
      },
    ],
  },
  entry: [
    'babel-polyfill',
    path.resolve('beeline/main.js'),
  ],
  output: {
    path: path.resolve('www/lib/beeline'),
    filename: 'bundle.js',
    pathinfo: true,
  },
  babel: {
    presets: ['es2015', 'stage-3'],
    sourceMaps: true,
  },
  externals: {
    'lodash': '_'
  }
};
