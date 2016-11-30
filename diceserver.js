var log 		= require ('./log');
var error		= require ('./error');
var config		= require ('./config');

var express 	= require ('express');
var serveStatic = require ('serve-static');
var compress 	= require ('compression');
var bodyParser  = require ('body-parser')
var morgan		= require ('morgan');
var mongoose	= require ('mongoose');

var depositController = require ('./controllers/deposit');

var app = express ();
var port = process.env.VCAP_APP_PORT || process.env.PORT || 8501;

var mongo_url = config.mongo;
var mongo_opts = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
                replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } } };


log.debug ('Mongo', 'Connecting to ' + mongo_url + '...');
mongoose.connect(mongo_url, mongo_opts, function(err) /*: void*/ {
	if (err) {
		log.critical ('Mongo', 'Connection error, exiting');
		process.exit();
	}
});


app.use (morgan ('route', { skip: function (req, res) { return (req.method == 'OPTIONS'); } }));
app.use (compress ());
app.use (bodyParser.json ());
app.use ('/', serveStatic ('frontend', {'index': ['index.html']}));
app.use ('/api/', require ('./route'));
app.all ('/*', function (req, res) { res.sendfile('frontend/index.html'); });

app.use(function(err, req, res, next) {
	log.critical ('Except', err.stack);
	error.response (res, 'E');
});

/* Check for new deposits and confirmations */
setInterval (depositController.detectNewDeposits, 30000);
setInterval (depositController.checkDepositConfirmations, 30000);
setInterval (depositController.swapDeposits, 60000);


mongoose.connection.once('open', function () {
    log.debug ('Mongo', 'Connection enstablished');

	app.listen (port);
	log.debug ('General', 'Started ' + config.coin + 'dice at ' + port);
});




