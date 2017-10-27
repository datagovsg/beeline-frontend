const shell = require("shelljs");
const assert = require("assert");

const BUILD_STARTED_MESSAGE = "Beeline frontend build process started";
const DEFAULT_BACKEND_URL = "https://api.beeline.sg";
const NO_WATCH_AND_PRODUCTION_MESSAGE = `
Watch and production flags cannot be used together
`;
const BACKEND_URL_NOT_SET_MESSAGE = `
BACKEND_URL environment variable not set. Defaulting to ${DEFAULT_BACKEND_URL}
`
const BUILD_COMPLETED_MESSAGE = "Beeline frontend build process complete";
const PRODUCTION_BUILD_MESSAGE = `
Starting production build. Remove the --production flag for development builds
`
const NON_PRODUCTION_BUILD_MESSAGE = `
Starting development build. Use the --production flag for production builds
`

// Check Flags
const production = process.argv.indexOf("--production") >= 0;
const watch = process.argv.indexOf("--watch") >= 0;
assert(!(watch && production), NO_WATCH_AND_PRODUCTION_MESSAGE);

// Build
console.log(BUILD_STARTED_MESSAGE);
// Clear away the old output and start fresh from template
shell.rm("-rf", "www/");
shell.cp("-r", "static/", "www/");
// Do a copy watch
if (watch) shell.exec(
  "cpx 'static/**/*' www/ --watch --no-initial",
  { async: true }
);
// Build switching based on production or non production
if (production) {
  console.log(PRODUCTION_BUILD_MESSAGE);
  shell.exec("webpack -p");
  shell.exec("cordova-hcp build www/");
  shell.exec("touch www/.nojekyll");
} else {
  console.log(NON_PRODUCTION_BUILD_MESSAGE);
  // Configure default environment variables for non production builds
  if (typeof process.env.BACKEND_URL === 'undefined') {
    console.log(BACKEND_URL_NOT_SET_MESSAGE);
    process.env.BACKEND_URL = DEFAULT_BACKEND_URL;
  }
  if (watch) { shell.exec("webpack -w", { async: true }); }
  else { shell.exec("webpack"); }
}
console.log(BUILD_COMPLETED_MESSAGE);
