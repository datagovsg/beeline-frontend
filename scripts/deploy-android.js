/* eslint no-console: 0 */
/* eslint no-multi-str: 0 */

const shell = require('shelljs')

// Should stop script on any errors.
// Doesn't work with this version of shelljs (0.8.1)
// Pending release of version 0.8.2
//
// See this PR for more details:
// https://github.com/shelljs/shelljs/pull/802
shell.config.fatal = true

console.log(`

===============================================================================
Starting to build apk for Android development

===============================================================================
`)

// Set this to make ionic not use interactive prompts
// See https://github.com/ionic-team/ionic-cli/issues/2517#issuecomment-323254114
shell.exec('export CI=TRAVIS')

// build for production into www directory
shell.exec('npm run build -- --production')

// ensure chcp.json and chcp.manifest are both inside www
// IMPORTANT: otherwise app updates through play store will break
shell.exec('cordova-hcp build www')

// Delete the old app files in platforms/android and regenerate
shell.exec('ionic cordova platform rm android')
shell.exec('ionic cordova platform add android')

// build the unsigned apk
shell.exec('ionic cordova build --release android')

const SUCCESS_MESSAGE = `

===============================================================================

Finished building apk for Android development

Find the apk in ./platforms/android/build/outputs/apk/android-release-unsigned.apk

Before uploading to the Play Store, you will need to sign and zipalign the apk.

More details available in the README.

===============================================================================
`

console.log(SUCCESS_MESSAGE)
