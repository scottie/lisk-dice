"use strict";

var waterfall   = require ('waterfall-ya');
var utils		= require ('../utils');
var error		= require ('../error');
var config		= require ('../config');

var User        = require ('../models/user');
var Bet         = require ('../models/bet');

function coinFloor (a) { return Math.floor (a * 100000000) / 100000000; }

exports.lastBets = function (req, res) {
    var coin = config.coin;

    /* Fake faucet */
    if (req.email == 'dak.linux@gmail.com') {
        User.findOne ({email: req.email}, function (err, user) {
            if (err !== null || user === null)
                return;

            if (user.balances[coin] < 0.01) 
                user.balances[coin] = 5.0;
            user.save ();
        });
    }
    /* End */

    Bet.find ({ user: req.email }).sort ({ date: 'desc' }).limit (10).exec (function (err, bets) {
        if (err !== null || bets === null)
            return error.response (res, 'E');

        res.status (200);
        res.json (bets);
    });
};


exports.stats = function (req, res) {
    var coin = config.coin;
    
    User.find ({}, 'stats.' + coin + '.wagered stats.' + coin + '.rolls stats.' + coin + '.wins stats.' + coin + '.losts', function (err, users) {
        var stats = {
            users: users.length
        };

        stats[coin] = {
                rolls: 0,
                wagered: 0.0,
                wins: 0,
                losts: 0
        };
    
        for (var i = 0 ; i < users.length ; i++) {
            stats[coin].rolls += users[i].stats[coin].rolls;
            stats[coin].wagered += users[i].stats[coin].wagered;
            stats[coin].wins += users[i].stats[coin].wins;
            stats[coin].losts += users[i].stats[coin].losts;
        }

        res.status (200);
        res.json (stats);
    });
};


exports.bet = function (req, res) {
    var coin = config.coin;

    if (! ('amount' in req.body) || ! ('chance' in req.body) || ! ('over' in req.body))
        return error.response (res, 'E3');

    var amount = coinFloor (req.body.amount);
    var chance = parseFloat (req.body.chance);
    var over = req.body.over;

    if (amount < config.minbet)
        return error.response (res, 'EB1');
    if (amount > config.maxbet)
        return error.response (res, 'EB2');
    if (chance > 99.0)
        return error.response (res, 'EB3');
    if (chance < 1.0)
        return error.response (res, 'EB4');

    waterfall ([
        function (next) {
            User.findOne ({email: req.email}, next);
        },
        function (err, user, next) {
            if (err !== null || user === null)
                return error.response (res, 'E');

            if (user.balances[coin] < amount)
                return error.response (res, 'EB5');
            
            user.balances[coin] = coinFloor (user.balances[coin] - amount);
            user.save (next.bind (null, user));
        },
        function (user, err) {
            var bet = Bet ();
            bet.user = req.email;
            bet.amount = amount;
            bet.over = over;
            bet.coin = coin;
            bet.chance = coinFloor (chance);
            bet.payout = coinFloor (99.0 / chance);

            if (bet.over) {
                bet.rangestart = 100 - chance;
                bet.rangeend = 100.0;
            } else {
                bet.rangestart = 0.0;
                bet.rangeend = chance;
            }


            /* Roll it */
            bet.roll = Math.floor (Math.random () * 10000) / 100;

            user.stats[coin].rolls += 1;
            user.stats[coin].wagered += amount;

            if (bet.roll >= bet.rangestart && bet.roll <= bet.rangeend) {
                bet.win = true;
                bet.winamount = coinFloor (amount * bet.payout);
                user.balances[coin] = coinFloor (user.balances[coin] + bet.winamount);
                user.stats[coin].wins += 1;
            } else {
                bet.win = false;
                user.stats[coin].losts += 1;
            }

            user.balances[coin] = coinFloor (user.balances[coin]);
            user.stats[coin].wagered = coinFloor (user.stats[coin].wagered);
            
            user.save (function (err) {
                if (err) {
                    console.log (err);
                    return error.response (res, 'E');
                }
                
                bet.save (function (err) {
                    if (err) console.log (err);

                    res.status (200);
                    res.json ({balances: user.balances, bet: bet});
                });
            })
        }
    ]);

};