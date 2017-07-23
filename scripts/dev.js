const shell = require("shelljs");
shell.exec("npm run build -- --watch", { async: true });
shell.exec("npm start", { async: true });
