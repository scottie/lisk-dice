var errors = {
	/* Common */
	"E": { message: "generic error", code: 500 },
	"E1": { message: "you are not authenticated", code: 401 },
	"E2": { message: "resource not found", code: 404 },
	"E3": { message: "invalid parameters", code: 500 },
	"E4": { message: "not yet impemented", code: 500 },
	"E5": { message: "invalid alpha token", code: 401 },
	"E6": { message: "not authorized", code: 401 },

	/* Signup */
	"ES1": { message: "email already taken", code: 500 },
	"ES2": { message: "invalid mail", code: 500 },
	"ES3": { message: "password should be at least 8 character long", code: 500 },
	
	/* Login */
	"EL1": { message: "wrong email / password combination", code: 401 },
	"EL2": { message: "you typed wrong credentials too many times; wait 5 minutes", code: 402 },
	"EL3": { message: "your email address is not yet verified", code: 402 },

	/* Bet */
	"EB1": { message: "amount too low", code: 500 },
	"EB2": { message: "amount too high", code: 500 },
	"EB3": { message: "chance too high", code: 500 },
	"EB4": { message: "chance too low", code: 500 },
	"EB5": { message: "not enough balance", code: 500 },

	/* Withdraw */
	"EW1": { message: "amount too low", code: 500 },
	"EW2": { message: "not enough funds", code: 500 },
	"EW3": { message: "invalid address", code: 500 },
};


exports.get = function (err, data) {
	var e = errors[err];
	if (!e) e = errors["E"];
	
	var ee = {error: err, message: e.message};

	if (data !== undefined)
		ee["data"] = data;

	return ee;	
};


exports.response = function (res, err, data) {
	var e = errors[err];
	if (!e) e = errors["E"];

	var ee = {error: err, message: e.message};

	if (data !== undefined)
		ee["data"] = data;

	res.status (e.code);
	res.json (ee);

	return null;
};
