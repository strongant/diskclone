(function() {
  angular.module('app')
    .service('diskService', ['$q', DiskService]);

  function DiskService() {
    return {
      loadDiskList: loadDiskList
    };
  }

  function loadDiskList() {

  }
})();
