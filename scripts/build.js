const shell = require("shelljs");

const BUILD_STARTED_MESSAGE = "Beeline frontend build process started";
const BUILD_COMPLETED_MESSAGE = "Beeline frontend build process complete";

// Check Flags
const production = process.argv.indexOf("--production") >= 0;

// Build
console.log(BUILD_STARTED_MESSAGE);
shell.rm("-rf", "www/");
shell.cp("-r", "static/", "www/");
if (production) {
  shell.exec("webpack --env.production");
  shell.exec("cordova-hcp build www/");
} else {
  shell.exec("webpack");
}
console.log(BUILD_COMPLETED_MESSAGE);