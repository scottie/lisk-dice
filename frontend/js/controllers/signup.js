shiftdiceControllers.controller ('SignupCtrl', ['config', '$scope', '$http', '$window', '$location', '$cookies',
	function (config, $scope, $http, $window, $location, $cookies) {
		if ($cookies.get ('token')) $location.path ('/');

		$scope.signup = { email: '', password: '', password2: '' };
		$scope.error = '';
		
		$scope.signupDo = function () {
			if ($scope.signup.password != $scope.signup.password2) {
				$scope.error = "XS1";
				return;
			}
			if ($scope.signup.email.length == 0) {
				$scope.error = "ES2";
				return;
			}
			if ($scope.signup.password.length < 8) {
				$scope.error = "ES3";
				return;
			}
			
			$scope.error = '';
			
			$http.post ('/api/signup', $scope.signup).then (function (data) {
				$location.path ('/login').search ({signup: 'true'});
			}, function (data) {
				$scope.error = data.error;		
			});
		};
	}
]);
