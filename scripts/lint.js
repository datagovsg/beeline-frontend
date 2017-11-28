const shell = require("shelljs")
shell.exec('printf "Linting the following JS files in this branch:\n\n"', {
  async: false,
})
shell.exec("git diff --name-only --cached origin/master -- '*.js'", {
  async: false,
})
shell.exec(
  "./node_modules/eslint/bin/eslint.js --fix `git diff --name-only --cached origin/master -- '*.js'`",
  { async: false }
)
