/* eslint no-console: 0 */
const path = require('path')
const assert = require('assert')
const InlineEnviromentVariablesPlugin = require('inline-environment-variables-webpack-plugin')

const prefix = process.env.BUILD_PREFIX || 'www'

const INLINED_ENVIRONMENT_VARIABLES = ['BACKEND_URL', 'TRACKING_URL', 'ROUTING_URL']

INLINED_ENVIRONMENT_VARIABLES.forEach(function (key) {
  assert(process.env[key], 'process.env.' + key + ' must be set')
})

module.exports = function (env) {
  env = env || {}
  return [
    // Javascript Config
    {
      devtool: 'source-map',
      module: {
        rules: [
          // Enable ES6 goodness
          {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
          },
          // Allow HTML imports
          {
            test: /\.html$/,
            loader: 'html-loader',
            options: { attrs: false }, // disable img:src loading
          },
          // Allow JSON imports
          {
            test: /\.json$/,
            loader: 'json-loader',
          },
          // Fix for libraries that require globals
          {
            test: require.resolve(
              'multiple-date-picker/dist/multipleDatePicker'
            ),
            loader: 'imports-loader?moment',
          },
        ],
      },
      entry: ['babel-polyfill', path.resolve('beeline/main.js')],
      output: {
        path: path.resolve(prefix, 'lib/beeline'),
        filename: 'bundle.js',
        pathinfo: !env.production,
      },
      plugins: [
        new InlineEnviromentVariablesPlugin(INLINED_ENVIRONMENT_VARIABLES),
      ],
      externals: {
        // Ionic's bundle already includes angular,
        // so we don't have to load it again
        angular: 'angular',
      },
    },
  ]
}
