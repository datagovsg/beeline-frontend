const shelljs = require('shelljs')
const assert = require('assert')
const process = require('process')
const path = require('path')
const fs = require('fs')

assert(process.argv.length === 4, `
scripts/hcp.js [CNAME domain] [build directory]

1. Writes to the CNAME file
2. Generates chcp.manifest chcp.json in the build directory
`)

const [x, y, cname, buildDir] = process.argv

// Write the CNAME
fs.writeFileSync(
  path.join(buildDir, 'CNAME'),
  cname
)

// Run the HCP config file
fs.writeFileSync('cordova-hcp.json',
  fs.readFileSync('cordova-hcp-live.json', 'utf-8')
  .replace('app.beeline.sg', cname)
)

shelljs.exec(`cordova-hcp build ${buildDir}`)
