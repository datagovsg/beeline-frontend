var path = require('path');
var fs = require('fs');

var env = {
    BACKEND_URL: process.env.BACKEND_URL || 'https://api.beeline.sg',
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
    plugins: ['transform-runtime']
  },
};
