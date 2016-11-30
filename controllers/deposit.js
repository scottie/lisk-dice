"use strict";

var waterfall   = require ('waterfall-ya');
var request     = require ('request');
var mnemonic 	= require ('bitcore-mnemonic');

var utils		= require ('../utils');
var error		= require ('../error');
var log         = require ('../log');
var config		= require ('../config');

var Deposit     = require ('../models/deposit');
var User        = require ('../models/user');


/* Generate a new deposit address for the user */
exports.generateDepositAddress = function (user, force, next) {
    var coin = config.coin;

	if (force === undefined) force = false;
	if (next === undefined) next = function () {}; 

	if (user.deposit[coin].address === null || force) {
		var mn = new mnemonic (mnemonic.Words.ENGLISH);

		request ({ method: 'POST', url: 'http://' + config.node[coin] + '/api/accounts/open', json: true, body: { secret: mn.toString () } },
			function (err, res, data) {
				if (data.success) {
					user.deposit[coin].seed = mn.toString ();
					user.deposit[coin].address = data.account.address;
					user.deposit[coin].pubkey = data.account.publicKey;
					user.save (function (err) {
						log.debug ('Wallet', 'Generated new address for: ' + user.email + ' (' + data.account.address + ')');
						next (user);
					});
				} else {
					next (user);
				}	
			}
		);
	} else
		next (user);
};



exports.userDeposits = function (req, res) {
    var coin = config.coin;
    
    Deposit.find ({user: req.email}, 'txid date amount from confirmations').sort ({date: 'desc'}).exec (function (err, deposits) {
        res.status (200);
        res.json (deposits);
    });
};


exports.swapDeposits = function () {
    var coin = config.coin;
    
    waterfall ([
        function (next) {
            Deposit.find ({confirmed: true, swapped: false, user: { $ne: "shiftdice@shiftdice" }}, next);
        },
        function (err, deposits, next) {
            next (0, deposits, next);
        },
        function (i, deposits, loop, next) {
            if (i >= deposits.length) return next ();
            var deposit = deposits[i];

            /*if (deposit.amount < 1.2) {
                deposit.user = "shiftdice@shiftdice";
                return deposit.save ();
            }*/

            /* Send amount to cold wallet */
            request ({ method: 'PUT', url: 'http://' + config.node[coin] + '/api/transactions', 
                body: {
                    "secret" : deposit.seed,
                    "amount" : (deposit.amount - 0.1) * 100000000,
                    "recipientId" : config.wallet[coin].address
                }, json: true },
                function (err, res, data) {
                    if (!err && data.success) { 
                        deposit.swapped = true;
                        deposit.save (function (err) {
                            log.debug ('Deposit', 'Sent to cold wallet: ' + data.transactionId);  
                            loop (i+1, deposits, loop);
                        });
                    } else {
                        console.log (data);
                        loop (i+1, deposits, loop);
                    }
                }
          );
        },
        function () {

        }
    ]);
};

exports.checkDepositConfirmations = function () {
    var coin = config.coin;
    
    waterfall ([
        function (next) {
            Deposit.find ({confirmed: false}, next);
        },
        function (err, deposits, next) {
            log.debug ('Deposit', 'Checking confirmations for ' + deposits.length + ' deposits...');  
            next (0, deposits, next);
        },
        function (i, deposits, loop, next) {
            if (i >= deposits.length) return next ();
            var deposit = deposits[i];

            request ({ url: 'http://' + config.node[coin] + '/api/transactions/get?id=' + deposit.txid, json: true },
                function (err, res, data) {
                    if (!err && data.success) {
                        deposit.confirmations = data.transaction.confirmations;

                        if (deposit.confirmations >= config.minconf) {
                            deposit.confirmed = true;

                            User.findOne ({email: deposit.user}, function (err, user) {
                                user.balances[coin] += deposit.amount;

                                deposit.save (function (err) {
                                    if (err) return console.log (err);
                                    
                                    user.save (function (err) {
                                        log.debug ('Deposit', 'Deposit ' + deposit.txid + ' confirmed.');

                                        loop (i+1, deposits, loop);
                                    });
                                })
                            });
                        } else {
                            deposit.save ();  
                            next (i+1, deposits, loop);
                        }
                    } else {
                        console.log (data);
                        next (i+1, deposits, loop);
                    }
                }
            );
        },
        function () {

        }
    ]);
};

exports.detectNewDeposits = function () {
    var coin = config.coin;
    
    waterfall ([
        function (next) {
            User.find ({}, 'email balances deposit.' + coin + '.seed deposit.' + coin + '.address', next);
        },
        function (err, users, next) {
            log.debug ('Deposit', 'Checking new deposits for ' + users.length + ' users...');    
            
            users.forEach (function (v) {
                next (v);

            });
        },
        function (user) {
            request ({ url: 'http://' + config.node[coin] + '/api/transactions?recipientId=' + user.deposit[coin].address, json: true },
                function (err, res, data) {
                    if (err === null && data.success) {
                        for (var j = 0; j < data.transactions.length; j++) {
                            var tx = data.transactions[j];
                            var dep = Deposit ();
                            dep.user = user.email;
                            dep.amount = tx.amount / 100000000;
                            dep.txid = tx.id;
                            dep.from = tx.senderId;
                            dep.coin = coin;
                            dep.to = tx.recipientId;
                            dep.seed = user.deposit[coin].seed;
                            dep.confirmations = tx.confirmations;

                            log.debug ('Deposit', 'Found new deposit: ' + dep.txid + ' of ' + dep.amount + coin);    

                            /* Save */
                            if ((tx.amount / 100000000) < config.mindeposit) {
                                dep.user = 'shiftdice@shiftdice';
                                log.debug ('Deposit', 'Deposit: ' + dep.txid + ' of ' + dep.amount + coin + ' is below minimum');  
                            }
                            
                            dep.save (function (err) {
                                if (err) {
                                    console.log (err);
                                }

                                /* Generate new address */
                                exports.generateDepositAddress (user, true, function (user) {
                                }); 
                            });
                        }
                    }
                }
            );
        },
        function () {
        }
    ]);
};