/*(function() {
  var loadCalcUSBUserSpaceStr =
    "sudo df -l |grep {USBMountPoint} |awk '{print $3}'";

  angular.module('app')
    .service('usbService', ['$q', UsbService]);

  function UsbService($q) {


    return {
      loadUSBList: loadUSBList,
      buildUSBData: buildUSBData,
      calcUSBSpace: calcUSBSpace
    };

    function loadUSBList() {
      var deferred = $q.defer();
      return deferred.promise();
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

    //构建usb信息
    function buildUSBData(usbData, tileTmpl) {
      var usbArr = [];
      try {
        if (usbData && usbData.length > 0) {

          for (var i = 0; i < usbData.length; i++) {
            var currentNode = usbData[i];
            console.log("currentNode:");
            console.log(currentNode);

            var subNode = null;
            if (currentNode.children && currentNode.children.length >= 1) {
              var tempNodeArr = [];
              for (var j = 0; j < currentNode.children.length; j++) {
                var usbNode = currentNode.children[j];
                if (usbNode.mountpoint !== '/cdrom') {
                  tempNodeArr.push(usbNode);
                }
              }
              subNode = tempNodeArr.splice(0, 1)[0];
            }
            console.log('subNode:');
            console.log(subNode);



            if (subNode && subNode.mountpoint) {
              it = angular.extend({}, tileTmpl);
              it.icon = it.icon + 'usb';
              it.background = 'blue';
              it.span = {
                row: 1,
                col: 1
              };
              //usb详情
              it.diskData = subNode;
              it.span.row = it.span.col = 3;
              subNode.mountpoint = subNode.mountpoint.replace(/\s+/g, "");
              it.realTitle = subNode.mountpoint;
              var usbMountPointArr = subNode.mountpoint.split('/');
              it.title = usbMountPointArr[usbMountPointArr.length - 1].replace(
                /\s+/g, "");
              if (currentNode.serial) {
                it.serial = currentNode.serial;
              }
              if (currentNode.vendor) {
                it.product = currentNode.vendor;
              }
              var usbUserSpace = calcUSBSpace(it.realTitle);
              if (usbUserSpace) {
                it.usbUesSpace = parseInt(usbUserSpace.toString());
                it.useCapacity = (usbUserSpace / 1024 / 1024).toFixed(1);
              }
              self.usbValArr.push(it.realTitle);
              if (it.title.length >= 15) {
                it.title = it.title.substr(0, 10) + "...";
              }
              it.title = it.title.replace('-', '_');
              if (subNode.size) {
                var diskNodeSize = subNode.size / 1024 / 1024 /
                  1024;
                it.capacity = diskNodeSize.toFixed(1);
              } else {
                it.capacity = 0;
              }
              it.capacityDiff = (it.useCapacity / it.capacity * 100).toFixed(
                0);
              usbArr.push(it);
            }

          }
        }
      } catch (e) {
        console.log(e);
      }
      return usbArr;
    }
  }
})();
*/
