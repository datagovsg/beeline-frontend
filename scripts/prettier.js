const shell = require("shelljs")
shell.exec(
  'printf "Running prettier on the following JS files in this branch:\n\n"',
  { async: false }
)
shell.exec(
  "./node_modules/prettier/bin/prettier.js --write `git diff --name-only --cached origin/master -- 'beeline/*.js'`",
  { async: false }
)
shell.exec(
  'printf "\n--------------------------------------------------------------\n\n"',
  { async: false }
)