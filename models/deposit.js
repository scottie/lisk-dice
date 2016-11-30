"use strict";

var mongoose 	= require('mongoose');

var DepositSchema = new mongoose.Schema ({
	user:			{ type: String,	required: true, index: true, lowercase: true },
	confirmed:		{ type: Boolean, default: false },
	confirmations:	{ type: Number, default: 0 },
	swapped:		{ type: Boolean, default: false, select: false },
	
	date:			{ type: Date,	default: Date.now ()	},
	
	coin:			{ type: String, default: 'shift' },
	amount:			{ type: Number, default: 0.0 },

	from:			{ type: String },
	to:				{ type: String },
	txid:			{ type: String },
	
	seed:			{ type: String }
});


module.exports = mongoose.model ('Deposit', DepositSchema);
