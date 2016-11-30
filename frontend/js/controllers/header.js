shiftdiceControllers.controller ('HeaderCtrl', ['config', '$scope', '$http', '$window', '$rootScope', '$route', '$cookies', 'gettextCatalog', '$location', '$interval',
	function (config, $scope, $http, $window, $rootScope, $route, $cookies, gettextCatalog, $location, $interval) {
		$scope.logged = false;

		var updateLogged = function () {
			if ($cookies.get('token')) {
				$scope.logged = true;
			} else {
				$scope.logged = false;
			}
		};

		$scope.$watch(function() { 
			return $cookies.get ('token'); 
		}, function(newValue) {
   			updateLogged ();
		});

		$scope.pagectrl = $route.current.controller;

		$scope.$on('$routeChangeStart', function(next, current) {
			try {
				$scope.pagectrl = current.$$route.controller;
			} catch (ex) {
				$scope.pagectrl = next.$$route.controller;
			}

			if ($cookies.get('token') && !$scope.logged)
				updateLogged ();
		});
		
		$scope.logout = function () {
			if ($cookies.get ('token')) {
				$cookies.remove ('token');
			}
			$location.path ('/login');
		};
	}
]);
