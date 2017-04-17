const path = require('path');
const fs = require('fs');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const InlineEnviromentVariablesPlugin = require('inline-environment-variables-webpack-plugin');

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

// Set up the backend URL
module.exports = []

module.exports.push({
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
    path: path.resolve('www/lib/beeline'),
    filename: 'bundle.js',
    pathinfo: true,
  },
  plugins: [
    new InlineEnviromentVariablesPlugin([
      'BACKEND_URL'
    ])
  ]
});

module.exports.push(compileSCSS('ionic.app.scss'))
module.exports.push(compileSCSS('operator-grab.scss'))

function compileSCSS(filename) {
  if (!filename.endsWith('.scss')) {
    throw new Error(`${filename} must end in .scss`)
  }

  return {
    entry: path.join(__dirname, `scss/${filename}`),
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
      path: path.resolve(`www/css`),
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
