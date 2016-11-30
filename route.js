"use strict"

var userController 	    = require ('./controllers/user');
var betController 	    = require ('./controllers/bet');
var depositController   = require ('./controllers/deposit');
var withdrawController  = require ('./controllers/withdraw');

var router = require ('express').Router();

/* User related */
router.post ('/signup', userController.recaptcha, userController.signup);
router.post ('/login', userController.recaptcha, userController.login);
router.get ('/auth/state', userController.checkLazy, userController.getAuthState);

router.get ('/stats', betController.stats);
router.post ('/bet', userController.check, betController.bet);

router.get ('/profile', userController.check, userController.profile);
router.get ('/profile/lastbets', userController.check, betController.lastBets);
router.get ('/profile/deposits', userController.check, depositController.userDeposits);
router.get ('/profile/withdraws', userController.check, withdrawController.userWithdraws);
router.post ('/profile/withdraw', userController.check, withdrawController.send);

module.exports = router;
