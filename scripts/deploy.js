const shell = require("shelljs");
const inquirer = require("inquirer");

const PROD_TARGET = "git@github.com:datagovsg/beeline-frontend-deploy.git";
const DEPLOYMENT_QUESTION = "Choose a deployment target";
const WARNING_MESSAGE = `
== WARNING == WARNING == WARNING == WARNING == WARNING ==

Deploying a build requires explicit QA approval by Beeline app partners.

Please confirm that you have this approval and you want to proceed.

== WARNING == WARNING == WARNING == WARNING == WARNING ==
`;
const STAGING_COMPLETE_MESSAGE = `
Completed deployment to staging server
`;
const PRODUCTION_COMPLETE_MESSAGE = `
Completed deployment to production environment
`;

inquirer.prompt([
  // Choose deployment target
  {
    name: "target",
    type: "list",
    message: DEPLOYMENT_QUESTION,
    choices: ["Staging", "Production", "Abort Deployment"],
    default: "Abort Deployment"
  },
  // Confirm deployment authorization
  {
    when: function(answers) {
      return answers.target === "Staging" || answers.target === "Production"
    },
    name: "confirm",
    type: "confirm",
    message: WARNING_MESSAGE,
    default: false,
  }
])
// Proceed with chosen deployment target after authoritcation
.then(function(answers) {
  if (answers.target === "Abort Deployment") return;
  if (answers.confirm === false) return;
  if (answers.confirm === true) {
    shell.exec("npm run build -- --production");
    // Clear the gh-pages cache to get it working with multiple remotes
    shell.rm("-rf", "node_modules/gh-pages/.cache");
  }
  // Staging deployment process
  if (answers.target === "Staging" && answers.confirm === true) {
    // Replace the production hot code push files with the staging url
    shell.sed(
      "-i",
      "app-pages.beeline.sg",
      "app-staging-pages.beeline.sg",
      ["www/CNAME", "www/chcp.json "]
    );
    shell.exec("gh-pages -t -d www/");
    console.log(STAGING_COMPLETE_MESSAGE);
  }
  // Production deployment process
  if (answers.target === "Production" && answers.confirm === true) {
    shell.exec(`gh-pages -t -r ${PROD_TARGET} -d www/`);
    console.log(PRODUCTION_COMPLETE_MESSAGE);
  }
});
