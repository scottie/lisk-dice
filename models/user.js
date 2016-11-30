"use strict";

var mongoose 	= require('mongoose');
var bcrypt 		= require('bcrypt-nodejs');

var UserSchema = new mongoose.Schema ({
	email: 			{ type: String,	unique: true, required: true, index: true, lowercase: true },
	password: 		{ type: String,	required: true,	select: false },
	
	lastlogin:		{ type: Date,	default: Date.now ()	},
	regdate: 		{ type: Date,	default: Date.now ()	},

	stats: {
		shift: {
			rolls: { type: Number, default: 0 },
			wagered: { type: Number, default: 0.0 },
			deposit: { type: Number, default: 0.0 },
			withdraw: { type: Number, default: 0.0 },
			wins: { type: Number, default: 0 },
			losts: { type: Number, default: 0 }
		},
		lisk: {
			rolls: { type: Number, default: 0 },
			wagered: { type: Number, default: 0.0 },
			deposit: { type: Number, default: 0.0 },
			withdraw: { type: Number, default: 0.0 },
			wins: { type: Number, default: 0 },
			losts: { type: Number, default: 0 }
		}
	},

	balances: {
		shift: 	{ type: Number, default: 0.0 },
		lisk: 	{ type: Number, default: 0.0 }
	},

	deposit: {
		shift: { 
			address: { type: String, default: null },
			seed:	 { type: String, select: false, default: null },
			pubkey:	 { type: String, select: false, default: null }
		},
		lisk: { 
			address: { type: String, default: null },
			seed:	 { type: String, select: false, default: null },
			pubkey:	 { type: String, select: false, default: null }
		}
	}
});



/* Password update */
UserSchema.pre('save', function(callback) {
	var user = this;

	/* Break out if the password hasn't changed */
	if (!user.isModified('password')) return callback();

	/* Password changed so we need to hash it */
	bcrypt.genSalt(5, function(err, salt) {
		if (err) return callback(err);

		bcrypt.hash(user.password, salt, null, function(err, hash) {
			if (err) return callback(err);
			user.password = hash;
			callback();
		});
	});
});


/* Check inserted password */
UserSchema.methods.verifyPassword = function(password, cb) {
	bcrypt.compare(password, this.password, function(err, isMatch) {
		if (err) return cb(err);
		cb(null, isMatch);
	});
};

module.exports = mongoose.model ('User', UserSchema);
