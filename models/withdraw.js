"use strict";

var mongoose 	= require('mongoose');

var WithdrawSchema = new mongoose.Schema ({
	user:			{ type: String,	required: true, index: true, lowercase: true },
	
	date:			{ type: Date,	default: Date.now ()	},
	coin:			{ type: String, default: 'shift' },
	amount:			{ type: Number, default: 0.0 },
	to:				{ type: String },
	txid:			{ type: String }	
});


module.exports = mongoose.model ('Withdraw', WithdrawSchema);
