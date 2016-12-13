shiftdiceControllers.controller ('LoginCtrl', ['config', '$scope', '$http', '$window', '$location', '$cookies', '$routeParams',
	function (config, $scope, $http, $window, $location, $cookies, $routeParams) {
		if ($cookies.get ('token')) $location.path ('/'); 

		$scope.login = { email: '', password: '' };
		$scope.justsign = false;
		$scope.error = '';
		
		if ('signup' in $routeParams)
			$scope.justsign = true;
		
		$scope.loginDo = function () {
			$scope.error = '';
			$scope.justsign = false;
			
			$http.post ('/api/login', $scope.login).then (function (data) {
				var expireDate = new Date();
				expireDate.setDate(expireDate.getDate() + 1);

				$cookies.put ('token', data.token); //, {'expires': expireDate});
				$cookies.put ('email', data.email); //, {'expires': expireDate});
				
				$location.path ('/');
			}, function (data) {
				$scope.error = data.error;
			});
		};
	}
]);
