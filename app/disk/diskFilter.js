/*(function() {
    angular.module('app').filter('quotereplace', function() {
      return function(input) {
        return input.replace(/"/, "");
      };
    })();*/

/*
    .factory('socket', function($rootScope) {
      var net = require('net');
      var chatServer = net.createServer()；
      chatServer.listen(9000);
      return {
        connection: function(client) {
          client.on(eventName, function(data) {
            var args = arguments;
            $rootScope.$apply(function() {
              callback.apply(chatServer, args);
            });
          });
        }
      };
    })*/
