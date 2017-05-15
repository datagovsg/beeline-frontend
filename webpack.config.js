const path = require('path');
const fs = require('fs');
const assert = require('assert')
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const InlineEnviromentVariablesPlugin = require('inline-environment-variables-webpack-plugin');

// Set up the backend URL
const webpackConfig = []

const prefix = process.env.BUILD_PREFIX || 'www'
const backendUrl = process.env.BACKEND_URL
const googleApiKey = process.env.GOOGLE_API_KEY
assert(backendUrl, "Env BACKEND_URL must be set! e.g. process.env.BACKEND_URL")

webpackConfig.push({
  devtool: 'source-map',
  module: {
    rules: [{
      test: /\.html$/,
      loader: 'html-loader',
      exclude: /node_modules/,
      options: {
        attrs: false, /* disable img:src loading */
      }
    }, {
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
    }, {
      test: /\.json$/,
      loader: 'json-loader',
    }, {
      // Fix for libraries that require moment as globals
      // Multiple Date Picker
      test: /\.js$/,
      use: [{
        loader: 'imports-loader?moment'
      }],
      include: [
        path.resolve('node_modules/multiple-date-picker/dist/multipleDatePicker.js'),
      ],
    }]
  },
  entry: [
    'babel-polyfill',
    path.join(__dirname, 'beeline/main.js')
  ],
  output: {
    path: path.join(__dirname, prefix, '/lib/beeline'),
    filename: 'bundle.js',
    pathinfo: true,
  },
  plugins: [
    new InlineEnviromentVariablesPlugin({
      BACKEND_URL: backendUrl,
      GOOGLE_API_KEY: googleApiKey
    })
  ]
});

webpackConfig.push(compileSCSS('ionic.app.scss'))
webpackConfig.push(compileSCSS('operator-grab.scss'))

function compileSCSS(filename) {
  if (!filename.endsWith('.scss')) {
    throw new Error(`${filename} must end in .scss`)
  }

  return {
    entry: path.join(__dirname, 'scss', filename),
    module: {
      rules: [{
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          use: [
            {loader: 'css-loader', options: {url: false}},
            {loader: 'sass-loader'}
          ],
        })
      }]
    },
    output: {
      // This output is entirely superfluous.
      // We are abusing Webpack so that it will compile the SCSS
      // What it means is that you can load the style sheet by
      // both <script src="....XXX.css.js"></script>
      // and also by <link href="....XXX.css" />
      path: path.join(__dirname, prefix, `css`),
      filename: filename.replace(/\.scss$/, '.css.js'),
      pathinfo: true,
    },
    plugins: [
      new ExtractTextPlugin({
        filename: filename.replace(/\.scss$/, '.css'),
      })
    ]
  }
}

module.exports = webpackConfig
