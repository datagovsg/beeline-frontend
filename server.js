var express = require('express');
var port = process.env.PORT || 5000;
app = express();
app.use(express.static('www'));
app.listen(port, function () {
	console.log('Express server listening on port ' + port);
});