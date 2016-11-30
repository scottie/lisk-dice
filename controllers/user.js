"use strict";

var jwt			= require ('jsonwebtoken');

var utils		= require ('../utils');
var error		= require ('../error');
var config		= require ('../config');
var log 		= require ('../log');

var User		= require ('../models/user');

var depositController = require ('./deposit');

/* Middleware: recaptcha */
exports.recaptcha = function (req, res, next) {
	return next ();
	
	var ver = 'secret=' + config.api.recaptcha.key + '&response=' + req.headers['captcha'];

	utils.postRaw ('www.google.com', '/recaptcha/api/siteverify', ver, function (err, response) {
		console.log (err, response);

		if (err != null || response == null || !response.success)
			return error.response (res, 'E6');

		return next ();
	});
};


/* Middleware: check the user authentication || raise ('E1')
 * 	req.email: email of the logged user
 */
exports.check = function(req, res, next) {
	var bearerToken;
	var bearerHeader = req.headers["authorization"];

	if (typeof bearerHeader !== 'undefined') {
		var bearer = bearerHeader.split(" ");
		bearerToken = bearer[1];
		jwt.verify(bearerToken, config.auth_secret, function(err, decoded) {
			if (err)
				return error.response (res, 'E1');

			req.email = decoded.email;
			next ();
		});
	} else {
		return error.response (res, 'E1');
	}
};



/* Middleware: check the user authentication (lazy)
 * 	req.username: username of the logged user || null
 */
exports.checkLazy = function(req, res, next) {
   var bearerToken;
   var bearerHeader = req.headers["authorization"];

   if (typeof bearerHeader !== 'undefined') {
	   var bearer = bearerHeader.split(" ");
	   bearerToken = bearer[1];
	   jwt.verify(bearerToken, config.auth_secret, function(err, decoded) {
		   if (err) req.email = null;
		   else 	req.email = decoded.email;

		   next ();
	   });
   } else {
	   req.email = null;
	   next ();
   }
};



/* POST api/login */
exports.login = function (req, res) {
	if (! ('email' in req.body) || ! ('password' in req.body))
		return error.response (res, 'E3');
		
	var email = req.body.email.toLowerCase ();

	if (!utils.mailCheck (email))
		return error.response (res, 'EL1');
		

	utils.waterfall ([
		function (next) {
			User.findOne({ email: email }, '+password', next);
		},
		function(err, user, next) {
			if (user == null)
				return error.response (res, 'EL1');

			user.verifyPassword (req.body.password, next.bind (null, user));
		},
		function (user, err, isMatch) {
			if (isMatch) {
				user.lastlogin = new Date ();
				user.save ();

				var token = jwt.sign({email: user.email}, config.auth_secret, { expiresIn: '1d' });

				res.status (200);
				res.json({
					token: token,
					expiration: 1440,
					email: user.email
				});
			} else {
				return error.response (res, 'EL1');
			}
		}
	]);
};

/* POST api/signup */
exports.signup = function(req, res) {
	/* Check for wrong data */
	if (! ('password' in req.body) || ! ('email' in req.body))
		return error.response (res, 'E3');
	else if (req.body.password < 8)
		return error.response (res, 'ES2');
	else if (!utils.mailCheck (req.body.email))
		return error.response (res, 'ES3');

	var email = req.body.email.toLowerCase ();
	var password = req.body.password;

	utils.waterfall ([
		function (next) {
			User.findOne ({email: email}, next);
		},
		function (err, user) {
			if (user != null)
				return error.response (res, 'ES1');

			var user = new User ({
				email: email,
				password: password,
			});

			user.save (function (err) {
				res.status (200);
				res.json({});
			});
		}
	]);
};




/* GET api/auth/state */
exports.getAuthState = function (req, res) {
	res.status (200);
	if (req.email != null)
		res.json ({auth: 'ok', email: req.email});
	else
		res.json ({auth: 'none', email: null});
};



/* GET api/profile */
exports.profile = function (req, res) {
	User.findOne ({email: req.email}, function (err, user){
		depositController.generateDepositAddress (user, false, function (user) {
			res.status (200);
			res.json (user);
		});
	});
};


