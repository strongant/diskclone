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
  //异步加载硬盘信息
  const exec = require('child_process').exec;
  //同步获取
  const execSync = require("child_process").execSync;
  const parseString = require('xml2js').parseString;
  var parser = require('xml2json');
  var usbJsonArr = [];
  var hardDiskJsonArr = [];
  var cdromJsonArr = [];
  var diskData = {};
  //sudo df -hl |grep /dev/sda1  获取使用大小
  var loadDiskCmdStr = 'sudo lshw  -xml';
  //{USBMountPoint}:U盘挂载点
  var loadCalcUSBUserSpaceStr =
    "df -l |grep {USBMountPoint} |awk '{print $3}'";
  //调用python 脚本文件进行硬盘复制
  var diskCloneCMDStr =
    "sudo python disk_copy.py '{execData}' ";
  angular.module('app')
    .service('diskService', ['$q', DiskService]);


  function DiskService($q) {
    return {
      loadDiskList: loadDiskList,
      calcUSBSpace: calcUSBSpace,
      execDiskCopy: execDiskCopy
    };

    function loadDiskList() {
      var deferred = $q.defer();
      exec(loadDiskCmdStr, {
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

          for (var i = 0; i < diskJson.length; i++) {

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
    //通过指定的USB设备名称计算已经使用空间
    function calcUSBSpace(usbMountPoint) {
      if (usbMountPoint) {
        loadCalcUSBUserSpaceStr = loadCalcUSBUserSpaceStr.replace(
          '{USBMountPoint}', usbMountPoint);
        return execSync(loadCalcUSBUserSpaceStr, {
          explicitArray: false,
          ignoreAttrs: false
        });
      }
    }

    //调用python 脚本进行硬盘复制
    function execDiskCopy(source) {
      if (source) {
        diskCloneCMDStr = diskCloneCMDStr.replace(
          '{execData}', source);
        return execSync(diskCloneCMDStr, {
          explicitArray: false,
          ignoreAttrs: false
        });
      }
    }

  }


})();
