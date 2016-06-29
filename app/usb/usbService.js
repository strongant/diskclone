(function() {
  angular.module('app')
    .service('diskService', ['$q', DiskService]);

  function DiskService($q) {
    return {
      loadUSBList: loadUSBList,
      buildUSBData: buildUSBData
    };

    function loadUSBList() {
      var deferred = $q.defer();
      return deferred.promise();
    }

    function buildUSBData() {
      var deferred = $q.defer();
      return deferred.promise();
    }
  }
})();
