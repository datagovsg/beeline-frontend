const path = require('path');
const fs = require('fs');
const assert = require('assert')
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const InlineEnviromentVariablesPlugin = require(
  'inline-environment-variables-webpack-plugin'
);

const prefix = process.env.BUILD_PREFIX || 'www'

assert(process.env.BACKEND_URL, "process.env.BACKEND_URL must be set")
const INLINED_ENVIRONMENT_VARIABLES = [
  "BACKEND_URL",
  "GOOGLE_API_KEY"  
];

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
};

module.exports = [
  {
    devtool: 'source-map',
    module: {
      rules: [
        // Enable ES6 goodness
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        },
        // Allow HTML imports
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: { attrs: false } // disable img:src loading
        },
        // Allow JSON imports
        {
          test: /\.json$/,
          loader: 'json-loader'
        },
        // Fix for libraries that require globals
        {
          test: require.resolve('multiple-date-picker/dist/multipleDatePicker'),
          loader: 'imports-loader?moment'
        }
      ]
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
      new InlineEnviromentVariablesPlugin(INLINED_ENVIRONMENT_VARIABLES)
    ]
  },
  compileSCSS('ionic.app.scss'),
  compileSCSS('operator-grab.scss')
];