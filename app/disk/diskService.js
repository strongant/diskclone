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
  var txtPath = 'data.xml';
  var execDiskCMDStr =
    'sudo lshw -class disk -class storage -class volume -xml > ' + txtPath;
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
      execDiskCopy: execDiskCopy,
      readCopyDiskInfo: readCopyDiskInfo
    };

    function loadDiskList() {
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
      } else {
        console.log('source参数不能为空...');
        deferred.reject('source参数不能为空...');
      }
      // setTimeout(function() {
      //   deferred.resolve('{"status":"success"}');
      // }, 5000);

      return deferred.promise;
    }

    //读取当前拷贝数据信息
    function readCopyDiskInfo(path) {
      try {
        if (path && fs.existsSync(path)) {
          var data = fs.readFileSync('/tmp/p', 'utf-8');
          if (data) {
            var result = {};
            var tempData = data.split(',');
            result['copySize'] = tempData[0].toString();
            result['buffer'] = tempData[1].toString();
            return result;
          }
        }
      } catch (e) {
        //logger.debug("err:" + e.toString());
        console.log(e);
      }

    }
  }
})();
