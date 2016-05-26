(function() {
  angular.module('app', ['ngRoute', 'ngMaterial', 'ngAnimate'])
    .config(['$routeProvider', function($routeProvider) {
      $routeProvider.when('/', {
        templateUrl: './disk/index.html',
        controller: 'diskController',
        controllerAs: '_diskctrl'
      });
      $routeProvider.otherwise({
        redirectTo: '/'
      });
    }]);
})();
