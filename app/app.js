(function() {
  angular.module('quotereplace', []).filter('quotereplace', function() {
    return function(input) {
      //.replace(/"/, "").replace(/"/, "");
      return input;
    };
  });
  angular.module('app', ['ngRoute', 'ngMaterial', 'ngAnimate',
      'quotereplace',
      'checklist-model', 'md.data.table'
    ])
    .config(['$routeProvider', function($routeProvider) {
      $routeProvider.when('/', {
        templateUrl: './disk/index.html',
        controller: 'diskController',
        controllerAs: 'vm'
      });
      $routeProvider.otherwise({
        redirectTo: '/'
      });
    }]);
})();
