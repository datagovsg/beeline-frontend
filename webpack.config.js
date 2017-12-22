/* eslint no-console: 0 */
const path = require("path")
const assert = require("assert")
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const InlineEnviromentVariablesPlugin = require("inline-environment-variables-webpack-plugin")

const prefix = process.env.BUILD_PREFIX || "www"
// const prefix = 'www'

const DEFAULT_BACKEND_URL = "https://api.beeline.sg"
const BACKEND_URL_NOT_SET_MESSAGE = `
BACKEND_URL environment variable not set. Defaulting to ${DEFAULT_BACKEND_URL}
`
if (typeof process.env.BACKEND_URL === "undefined") {
  console.log(BACKEND_URL_NOT_SET_MESSAGE)
  process.env.BACKEND_URL = DEFAULT_BACKEND_URL
}

const DEFAULT_TRACKING_URL = "https://tracking.beeline.sg"
const TRACKING_URL_NOT_SET_MESSAGE = `
TRACKING_URL environment variable not set. Defaulting to ${DEFAULT_TRACKING_URL}
`
if (typeof process.env.TRACKING_URL === "undefined") {
  console.log(TRACKING_URL_NOT_SET_MESSAGE)
  process.env.TRACKING_URL = DEFAULT_TRACKING_URL
}


const INLINED_ENVIRONMENT_VARIABLES = ["BACKEND_URL", "TRACKING_URL"]

INLINED_ENVIRONMENT_VARIABLES.forEach(function(key) {
  assert(process.env[key], "process.env." + key + " must be set")
})

module.exports = function(env) {
  env = env || {}
  return [
    // Javascript Config
    {
      devtool: "source-map",
      module: {
        rules: [
          // Enable ES6 goodness
          {
            test: /\.js$/,
            loader: "babel-loader",
            exclude: /node_modules/,
          },
          // Allow HTML imports
          {
            test: /\.html$/,
            loader: "html-loader",
            options: { attrs: false }, // disable img:src loading
          },
          // Allow JSON imports
          {
            test: /\.json$/,
            loader: "json-loader",
          },
          // Fix for libraries that require globals
          {
            test: require.resolve(
              "multiple-date-picker/dist/multipleDatePicker"
            ),
            loader: "imports-loader?moment",
          },
        ],
      },
      entry: ["babel-polyfill", path.resolve("beeline/main.js")],
      output: {
        path: path.resolve(prefix, "lib/beeline"),
        filename: "bundle.js",
        pathinfo: env.production ? false : true,
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

    // CSS Config
    {
      entry: {
        "ionic.app": "./scss/ionic.app.scss",
        "operator-grab": "./scss/operator-grab.scss",
      },
      module: {
        rules: [
          {
            test: /\.scss$/,
            use: ExtractTextPlugin.extract({
              use: [
                {
                  loader: "css-loader",
                  options: { url: false, minimize: true },
                },
                { loader: "sass-loader" },
              ],
            }),
          },
        ],
      },
      // This output is entirely superfluous.
      // We are abusing Webpack so that it will compile the SCSS
      // What it means is that you can load the style sheet by
      // both <script src="....XXX.css.js"></script>
      // and also by <link href="....XXX.css" />
      output: {
        path: path.resolve(prefix, `css`),
        filename: "[name].css.js",
        pathinfo: env.production ? false : true,
      },
      // The actual css output we care about
      plugins: [new ExtractTextPlugin("[name].css")],
    },
  ]
}
