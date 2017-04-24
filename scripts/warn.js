const process = require('process');

console.log(
`
== WARNING == WARNING == WARNING == WARNING == WARNING ==

By running this command, you solemnly swear that you have
obtained QA approval by Grab and other partners for this build.
If no, stop this deployment IMMEDIATELY.

== WARNING == WARNING == WARNING == WARNING == WARNING ==
`)

setTimeout(() => process.exit(0), 5000);
