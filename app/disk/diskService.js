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
  var loadDiskCmdStr = 'sudo';
  var txtPath = '/tmp/data.xml';
  var execDiskCMDStr =
    'sudo lshw -class disk -class storage -class volume -xml > ' + txtPath;

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

      // var allDiskData = spawn('sudo', ['lshw', '-class', 'disk',
      //     '-class', 'storage',
      //     '-class', 'volume',
      //     '-xml', '>', txtPath
      // ], {
      //     encoding: 'utf8'
      // });
      var child = exec(execDiskCMDStr);
      child.stderr.on('data', function(data) {
        console.log('stdout: ' + data);
        //logger.info("stdout:" + data);
        deferred.reject(data);
      });
      child.on('close', function(code) {
        var diskText = fs.readFileSync(txtPath, "utf8");
        var diskJson = null;
        var jsonObj = null;
        parseString(diskText, {
          explicitArray: false,
          attrkey: '$'
        }, function(err, result) {
          if (err) {
            console.log(err);
            deferred.reject(err);
          }
          jsonObj = result;
        });
        try {
          if (jsonObj) {
            diskJson = jsonObj.list.node;
            if (diskJson) {
              for (var i = 0; i < diskJson.length; i++) {
                if (diskJson[i].logicalname && diskJson[i].node) {
                  var subNode = diskJson[i];

                  if (subNode.node.$.id === 'cdrom') {
                    cdromJsonArr.push(subNode);
                  } else if (
                    subNode.businfo && subNode.businfo.indexOf('usb') >=
                    0) {
                    usbJsonArr.push(subNode);
                  } else {
                    hardDiskJsonArr.push(subNode);
                  }

                }
              }
            }
            diskData['cdromJsonData'] = cdromJsonArr;
            diskData['usbJsonData'] = usbJsonArr;
            diskData['hardDiskJsonData'] = hardDiskJsonArr;
            deferred.resolve(diskData);
          }
        } catch (e) {
          console.log(e);
          //logger.debug("err:" + e.toString());
          deferred.reject(e);
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
        // setTimeout(function() {
        //   deferred.resolve('{"status":"success"}');
        // }, 5000);

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
        //logger.debug("err:" + e.toString());
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

    function startSocket() {

    }
  }

  //chatServer.listen(9000);
})();
