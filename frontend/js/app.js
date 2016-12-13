var shiftdiceApp = angular.module ('shiftdiceApp', [
	'ngRoute',
	'shiftdiceControllers',
	'gettext',
	'angular-loading-bar',
	'ngCookies',
	'nemLogging'
]).config(['$compileProvider', function ($compileProvider){
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|http|mailto|bitcoin|data):/);
    }
]).constant('config', {
 
}).config (['$routeProvider', '$locationProvider',
	function ($routeProvider, $locationProvider) {
		$locationProvider.html5Mode({
			enabled: true,
			requireBase: true
		});

		$routeProvider.when ('/', {
			templateUrl: 'views/home.html',
			controller: 'HomeCtrl'
		}).when ('/login', {
			templateUrl: 'views/login.html',
			controller: 'LoginCtrl'
		}).when ('/signup', {
			templateUrl: 'views/signup.html',
			controller: 'SignupCtrl'
		}).otherwise({
			redirectTo: '/'
		});
	}
]);


var shiftdiceControllers = angular.module('shiftdiceControllers', []);


shiftdiceApp.run(['$rootScope', 'config', 'gettextCatalog', '$filter', '$http', '$window', '$location', '$cookies', 'cfpLoadingBar',
	function($rootScope, config, gettextCatalog, $filter, $http, $window, $location, $cookies, cfpLoadingBar) {
		$.material.init();
	}
]);

/* Auth HTTP API interceptor */
shiftdiceApp.factory('authInterceptor', ['$rootScope', '$q', '$window', '$location', '$cookies',
  function ($rootScope, $q, $window, $location, $cookies) {
	var service = {
		request: function (config) {
			config.headers = config.headers || {};
			if ($cookies.get ('token'))
				config.headers.Authorization = 'Bearer ' + $cookies.get ('token');

			return config;
		},
		response: function (response) {
			return response || $q.when(response);
		},
		responseError: function (response) {
			if (response.status == 401) {
				if (response.data.error == 'E1') {
					$cookies.remove ('token');
					$location.path ('/login');
				}
			}
			return $q.reject(response);
		}
	};
	return service;
}]);


/* Configure providers */
shiftdiceApp.config(['$httpProvider', '$logProvider', function ($httpProvider, $logProvider) {
	/* Append the auth interceptor on each call */
	$httpProvider.interceptors.push('authInterceptor');
	
	/* Disable leaflet log and other crappy logs */
	$logProvider.debugEnabled (false);
}]);


