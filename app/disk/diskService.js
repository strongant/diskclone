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
  const processor = require('process');
  //异步加载硬盘信息
  const exec = require('child_process').exec;
  const spawn = require('child_process').spawn;
  //同步获取
  const execSync = require("child_process").execSync;
  const parseString = require('xml2js').parseString;
  var parser = require('xml2json');

  //sudo df -hl |grep /dev/sda1  获取使用大小
  var loadDiskCmdStr = 'sudo lshw  -json > /tmp/data.json';
  //{USBMountPoint}:U盘挂载点
  var loadCalcUSBUserSpaceStr =
    "df -l |grep {USBMountPoint} |awk '{print $3}'";
  //调用python 脚本文件进行硬盘复制
  var diskCloneCMDStr =
    "sudo python  " + processor.cwd() +
    "/app/disk/disk_copy.py '{execData}' ";
  angular.module('app')
    .service('diskService', ['$q', DiskService]);


  function DiskService($q) {
    return {
      loadDiskList: loadDiskList,
      calcUSBSpace: calcUSBSpace,
      execDiskCopy: execDiskCopy
    };

    function loadDiskList() {
      var usbJsonArr = [];
      var hardDiskJsonArr = [];
      var cdromJsonArr = [];
      var diskData = {};
      var deferred = $q.defer();
      exec(loadDiskCmdStr, {
        explicitArray: false,
        ignoreAttrs: false
      }, function(err, stdout, stderr) {
        if (err) deferred.reject(err);

        var content = fs.readFileSync('/tmp/data.json', 'utf8');


        //var jsonObj = parser.toJson(stdout);
        //console.log(content);
        //var jsonObj = content;
        console.log('service----------------');
        console.log('object:');
        //console.log(content);
        //console.log(jsonObj);
        var diskJson = null;
        try {
          coreJson = JSON.parse(content);
          if (coreJson.children) {
            diskJson = coreJson.children[0].children;
            console.log('diskjson:');
            console.log(diskJson);
            console.log(diskJson.length);
          }
        } catch (e) {
          console.log(e);
          deferred.reject(e);
        }
        if (diskJson) {

          for (var i = 0; i < diskJson.length; i++) {

            if (diskJson[i].class === 'storage') {

              if (diskJson[i].children[0].id === 'cdrom') {
                cdromJsonArr.push(diskJson[i].children);
              } else if (diskJson[i].children[0].id === 'disk' &&
                diskJson[i]
                .configuration.driver ===
                'usb-storage') {
                usbJsonArr.push(diskJson[i].children);
              } else {
                hardDiskJsonArr.push(diskJson[i].children);
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
      var deferred = $q.defer();
      // if (source) {
      //   diskCloneCMDStr = diskCloneCMDStr.replace(
      //     '{execData}', source);
      //   exec(diskCloneCMDStr, {
      //     explicitArray: false,
      //     ignoreAttrs: false
      //   }, function(err, stdout, stderr) {
      //     if (err) deferred.reject(err);
      //     deferred.resolve(stdout);
      //   });
      // } else {
      //   console.log('source参数不能为空...');
      //   deferred.reject('source参数不能为空...');
      // }
      setTimeout(function() {
        deferred.resolve('{"status":"success"}');
      }, 5000);

      return deferred.promise;
    }

  }


})();
