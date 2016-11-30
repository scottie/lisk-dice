shiftdiceControllers.controller ('HomeCtrl', ['config', '$scope', '$http', '$window', '$location', '$cookies', '$interval', '$timeout',
	function (config, $scope, $http, $window, $location, $cookies, $interval, $timeout) {
		if ($cookies.get ('token')) { 
			$scope.logged = true; 
		}
		else {
			$scope.logged = false;
		}

		function coinFloor (a) { return Math.floor (a * 100000000) / 100000000; }

		$scope.auto = { enabled: false, number: 999, loop: false };
		$scope.rolling = false;
		$scope.bet = {
			amount: 0.01,
			profit: 0.02,
			chance: 49.5,
			payout: 2.0,
			over: true,
			limit: 49.5
		};
		$scope.lastbets = [];
		$scope.deposits = [];
		$scope.withdraws = [];
		$scope.withdrawstat = { status: 0, error: '', txid: '' };

		$scope.stats = {
			totalrolls: 0,
			last24rolls: 0,
			totalwagered: 0,
			totaldeposit: 0,
			totalwithdraw: 0
		};
		$scope.balance = 0.0;

		/* Stats */
		$scope.updateStats = function () {
			$http.get ('/api/stats').success (function (data) {
				$scope.stats = data;
			});
		};
		$scope.updateStats ();
		var int_stats = $interval (function () { $scope.updateStats () }, 5000);

		if (!$scope.logged) return;

		/* */
		$scope.updateProfile = function () {
			$http.get ('/api/profile').success (function (data) {
				$scope.profile = data;
				$scope.balance = data.balances.lisk;
				
			});
		};
		
		$scope.updateProfile ();
		var int_profile = $interval (function () { $scope.updateProfile () }, 5000);

		/* Last rolls */
		$http.get ('/api/profile/lastbets').success (function (data) {
			$scope.lastbets = data;
		});

		/* Withdraw */
		$scope.withdrawReload = function () {
			$http.get ('/api/profile/withdraws').success (function (data) {
				$scope.withdraws = data;
			});
		};

		$scope.withdrawModal = function () {
			$scope.withdrawstat = { error: '', status: 0 };
			$scope.withdraw = { address: '', amount: $scope.balance };
			$('#withdrawModal').modal ('show');
			$scope.withdrawReload ();
		};

		$scope.withdrawSend = function () {
			$http.post ('/api/profile/withdraw', $scope.withdraw).success (function (data) {
				$scope.withdrawstat = { error: data.error, status: 2, txid: data.txid };
			}).error (function (data) {
				$scope.withdrawstat = { error: data.error, status: 1 };
			});
		};

		/* Deposit */
		$scope.depositReload = function () {
			$http.get ('/api/profile/deposits').success (function (data) {
				$scope.deposits = data;
			});
		};

		$scope.depositModal = function () {
			$('#depositModal').modal ('show');
			$scope.depositReload ();
		};

		/* Autobet */
		$scope.autobet = function () {
			$scope.auto.enabled = !$scope.auto.enabled;
		};

		/* Bet logic */
		$scope.betAdjust = function (how) {
			if (how == 'half')
				$scope.bet.amount = $scope.bet.amount * 0.5;
			if (how == 'double')
				$scope.bet.amount = $scope.bet.amount * 2;
			if (how == 'full') {
				if ($scope.balance > 5) 
					$scope.bet.amount = 5.0;
				else
					$scope.bet.amount = $scope.balance;
			}
		};

		$scope.$watch (function() { 
			return $scope.bet.amount;
		}, function (newValue) {
			$scope.bet.profit = $scope.bet.amount * $scope.bet.payout;

			if ($scope.bet.amount > 2)
				$scope.amount = 2;
			if ($scope.bet.amount < 0.1)
				$scope.amount = 0.1;
		});
		$scope.$watch (function() { 
			return $scope.bet.profit;
		}, function (newValue) {
			$scope.bet.amount = $scope.bet.profit / $scope.bet.payout;
		});
		$scope.$watch (function() { 
			return $scope.bet.chance;
		}, function (newValue) {
			$scope.bet.payout = 99.0 / $scope.bet.chance;
		});		
		$scope.$watch (function() { 
			return $scope.bet.payout;
		}, function (newValue) {
			$scope.bet.profit = $scope.bet.amount * $scope.bet.payout;
			$scope.bet.chance = 99.0 / $scope.bet.payout;

			if ($scope.bet.over)
				$scope.bet.limit = 100.0 - $scope.bet.chance;
			else
				$scope.bet.limit = $scope.bet.chance;
		});

		$scope.autoloop = function () {
			if ($scope.auto.enabled && !$scope.auto.loop) {
				$scope.auto.loop = true;
				$scope.roll ();
			}
			else if ($scope.auto.enabled && $scope.auto.loop) 
				$scope.auto.loop = false;
		};

		$scope.roll = function () {
			$scope.rolling = true;

			if ($scope.auto.number == 0) {
				 $scope.auto.loop = false;
				 return;
			}

			if ($scope.balance < $scope.bet.amount) {
				$.snackbar({ content: "Not enough funds", style: "snackbar", timeout: 2000 });
				$scope.auto.loop = false;
				$scope.rolling = false;
				return;
			}

			$http.post ('/api/bet', { amount: $scope.bet.amount, chance: $scope.bet.chance, over: $scope.bet.over, coin: 'lisk' }).success (function (data) {
				$scope.rolling = false;

				if (data.bet.win) {
					$.snackbar({ content: "Roll: " + data.bet.roll + ". You won " + data.bet.winamount + " LSK", style: "snackbar", timeout: 2000 });
				} else {
					$.snackbar({ content: "Roll: " + data.bet.roll + ". You lost " + data.bet.amount + " LSK", style: "snackbar", timeout: 2000 });
				}
				$scope.lastbets.unshift (data.bet);
				$scope.lastbets = $scope.lastbets.slice(0, 10);
				$scope.balance = data.balances.lisk;

				if ($scope.auto.enabled && $scope.auto.loop) {
					$scope.auto.number -= 1;
					$timeout ($scope.roll, 1000);
				}
			}).error (function (data) {
				$scope.rolling = false;
				$scope.auto.loop = false;

				var content;

				switch (data.error) {
					case 'EB1': 
						content = "Amount too low";
						break;
					case 'EB2': 
						content = "Amount too high";
						break;
					case 'EB3': 
						content = "Chance too high";
						break;
					case 'EB4': 
						content = "Chance too low";
						break;
					case 'EB5': 
						content = "Not enough balance";
						break;
					default:
						content = "Error";
				}

				$.snackbar({ content: content, style: "snackbar", timeout: 2000 });
			});
		};



		/* Destroy */
		$scope.$on('$destroy', function() {
			$interval.cancel (int_stats);
			$interval.cancel (int_profile);
		});
	}
]);
