(function() {

  const {
    remote
  } = require('electron');
  const {
    BrowserWindow,
    dialog,
    shell
  } = remote;
  const fs = require('fs');
  const exec = require('child_process').exec;
  const parseString = require('xml2js').parseString;
  var cmdStr = 'sudo lshw -class disk -xml';

  angular.module('app')
    .service('diskService', ['$q', DiskService]);


  function DiskService($q) {
    return {
      loadDiskList: loadDiskList
    };

    function loadDiskList() {
      console.log('service->loadDiskList ');
      var deferred = $q.defer();
      exec(cmdStr, {
        explicitArray: false,
        ignoreAttrs: true
      }, function(err, stdout, stderr) {
        if (err) deferred.reject(err);
        //var data = JSON.parse(stdout);
        var data = stdout;
        //transfer xml to JSON
        parseString(data, {
          trim: true,
          explicitArray: false
        }, function(err, result) {
          if (err) deferred.reject(err);
          //console.log(JSON.stringify(result));
          deferred.resolve(result);
        });
      });
      return deferred.promise;
    }
  }


})();
