"use strict";

var mongoose 	= require('mongoose');

var BetSchema = new mongoose.Schema ({
	user:			{ type: String,	required: true, index: true, lowercase: true },
	
	date:			{ type: Date,	default: Date.now ()	},
	coin:			{ type: String, default: 'shift' },
	amount:			{ type: Number, default: 0.0 },
	
	payout:			{ type: Number, default: 2 },
	chance:			{ type: Number, default: 49.5 },
	over:			{ type: Boolean },
	rangestart:		{ type: Number },
	rangeend:		{ type: Number },


	serverseed:		{ type: String },
	clientseed:		{ type: String },
	nonce:			{ type: Number },

	roll: 			{ type: Number },
	win:			{ type: Boolean },
	winamount:		{ type: Number, default: 0 }
});


module.exports = mongoose.model ('Bet', BetSchema);
