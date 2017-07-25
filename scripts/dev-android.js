const shell = require("shelljs");
shell.exec("npm run build -- --watch", { async: true });
shell.exec("cordova-hcp server", { async: true });
shell.exec("ionic cordova run android");