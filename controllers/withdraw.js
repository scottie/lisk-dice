"use strict";

var waterfall   = require ('waterfall-ya');
var request     = require ('request');
var mnemonic 	= require ('bitcore-mnemonic');

var utils		= require ('../utils');
var error		= require ('../error');
var log         = require ('../log');
var config		= require ('../config');

var Withdraw    = require ('../models/withdraw');
var User        = require ('../models/user');


exports.userWithdraws = function (req, res) {
    Withdraw.find ({user: req.email}, 'txid date amount to').sort ({date: 'desc'}).exec (function (err, withdraws) {
        res.status (200);
        res.json (withdraws);
    });
};


exports.send = function (req, res) {
    var coin = config.coin;
    var amount = parseFloat (req.body.amount);
    var to = req.body.address;

    if (amount < config.minwithdraw)
        return error.response (res, 'EW1');    

    if (to.length != 20)
        return error.response (res, 'EW3');    


    waterfall ([
        function (next) {
            User.findOne ({email: req.email}, next);
        },
        function (err, user, next) {
            if (err !== null || user === null)
                return error.respone (res, 'E');

            if (user.balances[coin] < amount)         
                return error.response (res, 'EW2');     

            user.balances[coin] -= amount;
            user.save (function (err) {
                if (err) return error.respone (res, 'E');

                request ({ method: 'PUT', url: 'http://' + config.node[coin] + '/api/transactions', 
                    body: {
                        "secret" : config.wallet[coin].seed,
                        "amount" : parseInt ((amount - config.withdrawfee) * 100000000),
                        "recipientId" : to
                    }, json: true }, next.bind (null, user));
            });
        },
        function (user, err, ress, data) {
            if (!err && data.success) {
                var w = Withdraw ();
                w.user = req.email;
                w.to = to;
                w.amount = amount - 0.25;
                w.txid = data.transactionId;
                w.coin = coin;
                w.save (function (err) {
                    if (err) console.log (err);
                    res.status (200);
                    res.json ({ txid: w.txid });
                });
            } else {
                console.log (data);
                user.balances[coin] += amount;
                user.save (function (err) {
                    return error.response (res, 'E');
                });
            } 
        }
    ]);
};
