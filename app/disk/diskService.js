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
  var parser = require('xml2json');
  var usbJsonArr = [];
  var hardDiskJsonArr = [];
  var cdromJsonArr = [];
  var diskData = {};
  //sudo df -hl |grep /dev/sda1  获取使用大小
  var cmdStr = 'sudo lshw  -xml';
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
        ignoreAttrs: false
      }, function(err, stdout, stderr) {
        if (err) deferred.reject(err);
        var jsonObj = parser.toJson(stdout);
        var diskJson = null;
        try {
          coreJson = JSON.parse(jsonObj).list.node;
          if (coreJson.node && coreJson.node.id === 'core') {
            diskJson = coreJson.node.node;
          }
        } catch (e) {
          console.log(e);
          deferred.reject(e);
        }
        if (diskJson) {
          console.log('diskJson.length:' + diskJson.length);
          for (var i = 0; i < diskJson.length; i++) {
            console.log(i);
            if (diskJson[i].class === 'storage') {

              if (diskJson[i].node.id === 'cdrom') {
                cdromJsonArr.push(diskJson[i].node);
              } else if (diskJson[i].node.id === 'disk' && diskJson[i]
                .businfo !==
                undefined && diskJson[i].configuration.setting.id ===
                'driver') {
                usbJsonArr.push(diskJson[i].node);
              } else {
                hardDiskJsonArr.push(diskJson[i].node);
              }

            }
          }
        }
        diskData['cdromJsonData'] = cdromJsonArr;
        diskData['usbJsonData'] = usbJsonArr;
        diskData['hardDiskJsonData'] = hardDiskJsonArr;
        deferred.resolve(diskData);
        //var data = JSON.parse(stdout);
        // var data = stdout;
        // //transfer xml to JSON
        // parseString(data, {
        //   trim: true,
        //   explicitArray: false
        // }, function(err, result) {
        //   if (err) deferred.reject(err);
        //   //console.log(JSON.stringify(result));
        //   deferred.resolve(result);
        // });
      });
      return deferred.promise;
    }
    //通过指定的设备名称计算已经使用空间

  }


})();
