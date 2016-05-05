var express = require('express');
var port = process.env.PORT || 5000;
app = express();
app.use(express.static('www'));
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});
app.listen(port, function () {
	console.log('Express server listening on port ' + port);
});