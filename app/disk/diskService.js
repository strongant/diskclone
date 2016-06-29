(function() {

  const {
    remote
  } = require('electron');
  const {
    BrowserWindow,
    dialog,
    shell
  } = remote;
  const request = require('request');
  const fs = require('fs');
  const processor = require('process');

  const log4js = require('log4js');

  /*  log4js.configure({
      appenders: [{
        type: 'console'
      }, {
        type: 'file',
        filename: '/tmp/access.log',
        maxLogSize: 1024,
        backups: 4,
        category: 'normal'
      }],
      replaceConsole: true
    });
    const logger = log4js.getLogger('diskclone');
    logger.setLevel('INFO');*/

  /*const logger = require('./logger.js').logger(
    'diskService');*/


  //异步加载硬盘信息
  const exec = require('child_process').exec;
  var spawn = require('child-process-promise').spawn;
  //var logger = require('../diskLogger').logger('disk');
  //const spawn = require('child_process').spawnSync;
  //const spawn = require('child_process').spawn;

  //同步获取
  const execSync = require("child_process").execSync;
  var x2js = new X2JS();
  const parseString = require('xml2js').parseString;
  var parser = require('xml2json');
  //sudo df -hl |grep /dev/sda1  获取使用大小
  //解析新版内置硬盘出错
  var newTxtPath = '/tmp/newdisk.json';
  //name,mountpoint,model,vendor,serial,size,hotplug,type,fstype -b -J >/tmp/data.json
  var execInnerDiskCMDStr =
    'sudo lsblk -o name,mountpoint,model,vendor,serial,size,hotplug,type,fstype  -b -J >' +
    newTxtPath;

  //{USBMountPoint}:U盘挂载点
  var loadCalcUSBUserSpaceStr =
    "sudo df -l |grep {USBMountPoint} |awk '{print $3}'";
  //获取USB设备的product,#usbNo#USB设备挂载编号
  var getUSBProductStr = "sudo  cat #usbNo# |grep Product |awk '{print $2}'";
  //获取USB设备的序列号
  var getUSBSerialNOStr =
    "sudo cat #usbNo# |grep Serial\ Number |awk '{print $3}'";
  //调用python 脚本文件进行硬盘复制
  var diskCloneCMDStr =
    "sudo python  /var/opt/dcpy/disk_copy.py '{execData}' ";

  var loadProcessStr = 'printf "status" | nc 127.0.0.1 9999';

  var killPythonProcess = 'sudo killall python';


  angular.module('app')
    .service('diskService', ['$q', DiskService]);


  function DiskService($q) {
    return {
      loadDiskList: loadDiskList,
      calcUSBSpace: calcUSBSpace,
      execDiskCopy: execDiskCopy,
      readCopyDiskInfo: readCopyDiskInfo,
      deleteFileExists: deleteFileExists,
      getUSBProduct: getUSBProduct,
      getUSBSerialNO: getUSBSerialNO,
      killPython: killPython
    };

    function killPython() {
      exec(killPythonProcess);
    }

    function loadDiskList() {
      killPython();

      var usbJsonArr = [];
      var hardDiskJsonArr = [];
      var cdromJsonArr = [];
      var diskData = {};
      var deferred = $q.defer();
      var child = exec(execInnerDiskCMDStr);
      child.stderr.on('data', function(data) {
        console.log('stderr: ' + data);
        deferred.reject(data);
      });
      child.on('close', function(code) {
        var allDiskData = fs.readFileSync(newTxtPath, "utf-8");
        if (allDiskData) {
          var allDiskJSONData = JSON.parse(allDiskData);
          if (allDiskJSONData.blockdevices) {
            var diskArr = allDiskJSONData.blockdevices;
            for (var i = 0; i < diskArr.length; i++) {
              var diskNode = diskArr[i];
              //build cdrom
              if (diskNode.hotplug === '1' && diskNode.type === 'rom') {
                cdromJsonArr.push(diskNode);
              } else if (diskNode.hotplug === '0' && diskNode.type ===
                'disk') {
                //build harddisk
                hardDiskJsonArr.push(diskNode);
              } else if (diskNode.hotplug === '1' && diskNode.type ===
                'disk') {
                //build usb
                usbJsonArr.push(diskNode);
              }
            }
            diskData['cdromJsonData'] = cdromJsonArr;
            diskData['usbJsonData'] = usbJsonArr;
            diskData['hardDiskJsonData'] = hardDiskJsonArr;
            deferred.resolve(diskData);
          }
        }
      });
      return deferred.promise;
    }



    //通过指定的USB设备名称计算已经使用空间
    function calcUSBSpace(usbMountPoint) {
      if (usbMountPoint) {
        var tempCalcStr = loadCalcUSBUserSpaceStr.replace(
          '{USBMountPoint}', usbMountPoint);
        return execSync(tempCalcStr, {
          explicitArray: false,
          ignoreAttrs: false
        });
      }
    }

    //调用python 脚本进行硬盘复制
    function execDiskCopy(source) {
      var deferred = $q.defer();
      if (source) {
        var tempCMDStr = diskCloneCMDStr.replace(
          '{execData}', source);
        exec(tempCMDStr, {
          explicitArray: false,
          ignoreAttrs: false
        }, function(err, stdout, stderr) {
          if (err) deferred.reject(err);
          deferred.resolve(stdout);
        });


        return deferred.promise;
      }
    }

    //读取当前拷贝数据信息
    function readCopyDiskInfo() {
      var deferred = $q.defer();
      try {
        var tempCalcStr = loadProcessStr;
        exec(tempCalcStr, {
          explicitArray: false,
          ignoreAttrs: false
        }, function(err, stdout, stderr) {
          if (err) deferred.reject(err);
          deferred.resolve(stdout);
        });
      } catch (e) {
        console.log(e);
      }
      return deferred.promise;
    }
    //判断文件是否存在，如果存在将其删除
    function deleteFileExists(path) {
      if (path && fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    }

    //获取usb product
    function getUSBProduct(usbNO) {
      if (usbNO) {
        var tempUSBProductStr = getUSBProductStr.replace(
          '#usbNo#', usbMountNO);
        return execSync(tempUSBProductStr, {
          explicitArray: false,
          ignoreAttrs: false
        });
      }
    }
    //获取usb serialNo
    function getUSBSerialNO(usbNO) {
      if (usbNO) {
        var tempUSBSerialNOStr = getUSBSerialNOStr.replace(
          '#usbNo#', usbNO);
        return execSync(tempUSBSerialNOStr, {
          explicitArray: false,
          ignoreAttrs: false
        });
      }
    }
  }


})();
