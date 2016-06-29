(function() {


  angular.module('app')
    .controller('diskController', ['$scope', '$interval',
      'diskService', '$q',
      '$mdDialog', '$route',
      DiskController
    ]).config(function($mdIconProvider) {
      $mdIconProvider.iconSet("avatar",
        'assets/icons/avatar-icons.svg',
        128);
    });



  function DiskController($scope, $interval, diskService, $q,
    $mdDialog, $route) {
    var self = this,
      j = 0,
      counter = 0;
    self.activated = true;
    self.determinateValue = 30;
    //选中的硬盘
    self.disks = [];
    self.usbArr = [];
    self.usbValArr = [];
    self.hash = false;
    self.blockSize = 8;
    //硬盘详细信息展示
    self.detailData = '点击左边硬盘显示详细信息';
    self.showTitle = '显示硬盘详情';
    //需要发送调用python脚本的json对象
    self.postData = {};
    self.checkDiskSize = 0;
    //显示操作进度
    self.diskCloneOP = null;
    self.cloneTip = '克隆进行中,请稍后...';
    self.mode = 'query';
    self.cloneActivated = false;
    self.determinateValue = 30;
    self.determinateValue2 = 30;
    self.showList = [];
    self.startCloneDisabled = false;
    self.waitLoadUSB = false;



    var stop = $interval(function() {
      // Increment the Determinate loader
      self.determinateValue += 1;
      if (self.determinateValue > 100) {
        self.determinateValue = 30;
      }
    }, 100, 0, true);
    self.tiles = buildGridModel({
      icon: "avatar:svg-",
      title: "/dev/",
      background: "red",
      capacity: "0",
      useCapacity: "0",
      unit: "G",
      capacityDiff: "0",
      realTitle: "",
      currentDiskDetail: [],
      realSize: 0,
      usbUesSpace: 0
    });



    //对加载到的硬盘进行格式化显示
    function buildGridModel(tileTmpl) {
      var it, results = [],
        usbResults = [];


      diskService.loadDiskList().then(function(disk) {
        if (!disk) {
          console.log('this computer is no disk or load error');
          return;
        }
        var cdromData = disk['cdromJsonData'];
        var hardDiskData = disk['hardDiskJsonData'];
        var usbData = disk['usbJsonData'];
        //显示USB信息
        buildUSBData(usbData, tileTmpl);
        //不显示cdrom
        //var expectUsbArr = cdromData.concat(hardDiskData);

        var expectUsbArr = hardDiskData;


        //构造除过cdrom和usb的存储设备信息
        buildHardDiskData(expectUsbArr, tileTmpl, results)
          //加载完毕取消等待消息
        $interval.cancel(stop);
        //检测USB设备
        if (self.usbArr.length <= 0) {
          self.showDialog('克隆提示', '请插入USB设备进行操作!', '操作提示', '返回操作');
        }
        self.activated = false;
        //usb全选和不选操作
        self.selected = [];
        self.toggle = function(item, list) {
          if (!self.startCloneDisabled) {
            var idx = list.indexOf(item);
            if (idx > -1) {
              list.splice(idx, 1);
            } else {
              list.push(item);
            }
          }

        };

        self.exists = function(item, list) {
          return list.indexOf(item) > -1;
        };

        self.isIndeterminate = function() {
          return (self.selected.length !== 0 &&
            self.selected.length !== self.usbValArr.length);
        };

        self.isChecked = function() {
          return self.selected.length === self.usbValArr.length;
        };

        self.toggleAll = function() {
          //当在进行克隆操作时点击无效
          if (!self.startCloneDisabled) {
            if (self.selected.length === self.usbValArr.length) {
              self.selected = [];
            } else if (self.selected.length === 0 || self.selected.length >
              0) {
              self.selected = self.usbValArr.slice(0);
            }
          }

        };

      });
      return results;
    }
    self.showCurrentDiskInfo = function(data, title, size) {
      //console.log('showCurrentDiskInfo---->data:' + data);
      //self.detailData = data;
      if (!self.startCloneDisabled) {
        self.detailData = data;
        self.showTitle = title;
        self.disks = [];
        self.disks.push(title);
        self.checkDiskSize = size;
      }
    };

    self.diskSizeType = [8, 16, 32];

    //显示克隆状态信息
    self.showProress = function(readDiskInfo) {
      self.cloneActivated = true;
      self.startCloneDisabled = true;
      if (readDiskInfo) {
        self.determinateValue = readDiskInfo.process;
        self.determinateValue2 = self.determinateValue +
          readDiskInfo.buffer;
        var tempTip = self.cloneTip;
        if (readDiskInfo.speed !== undefined) {
          self.cloneTip = '克隆进行中,当前速度:' + readDiskInfo.speed +
            'MB/S,请稍后...';
        }
        var countSize = 100;
        //console.log(self.checkDiskSize);
        if (self.determinateValue >= countSize) self.determinateValue =
          self.determinateValue;
      }
    };


    self.startCopy = function() {
      if (self.disks.length === 0) {
        self.showDialog('克隆提示', '请至少选择一个硬盘进行操作!', '操作提示', '返回选择');
        return;
      }
      if (self.blockSize === 0) {
        self.showDialog('克隆提示', '请选择块大小!', '操作提示', '返回选择');
        return;
      }
      if (self.selected.length == 0) {
        self.showDialog('克隆提示', '请至少选择一个USB进行硬盘克隆操作!', '操作提示', '返回选择');
        return;
      }
      var checkedDiskSerial = checkedDiskProduct = '';
      //组装选中的USB设备可用空间
      var checkUSBCapacityArr = [],
        targetPaths = [];
      //console.log('self.usbArr:');
      //console.log(self.usbArr);
      for (var i = 0; i < self.usbArr.length; i++) {
        var useCapacity = self.usbArr[i];
        if (self.usbValArr.indexOf(useCapacity.realTitle) > -1) {
          var usbCapacityObj = {};
          targetPaths.push(useCapacity.realTitle);
          usbCapacityObj['name'] = useCapacity.realTitle;
          usbCapacityObj['capacity'] = useCapacity.usbUesSpace;
          if (useCapacity.serial) {
            usbCapacityObj['serial'] = useCapacity.serial;
          }
          if (useCapacity.product) {
            usbCapacityObj['product'] = useCapacity.product;
          }
          checkUSBCapacityArr.push(usbCapacityObj);
        }
      }
      for (var i = 0; i < self.tiles.length; i++) {
        var tempDisk = self.tiles[i];
        if (self.disks.indexOf(tempDisk.realTitle) > -1) {
          if (tempDisk.serial) {
            checkedDiskSerial = tempDisk.serial;
          }
          if (tempDisk.product) {
            checkedDiskProduct = tempDisk.product;
          }
          break;
        }
      }

      var checkedDiskSize = self.checkDiskSize; //单位为字节

      self.postData['sourceDisk'] = {
        "serial": checkedDiskSerial,
        "product": checkedDiskProduct,
        "logicalName": self.disks[0],
        "size": {
          "value": checkedDiskSize,
          "units": "bytes"
        }
      };
      self.postData['targetCapacityArr'] = checkUSBCapacityArr;
      self.postData['targetFolder'] = self.selected;
      self.postData['isHash'] = self.hash;
      self.postData['blockSize'] = self.blockSize;

      self.postStr = JSON.stringify(self.postData);
      console.log('postStr:');
      console.log(self.postStr);

      try {
        //var cloneOut = '/tmp/p';
        //diskService.deleteFileExists(cloneOut);
        //显示克隆进度条
        self.diskCloneOP = $interval(function() {
          self.determinateValue = 0;
          self.determinateValue2 = 0;
          //读取已经克隆的大小
          diskService.readCopyDiskInfo().then(
            function(readDiskInfo) {
              //console.log('diskService--readDiskInfo:' + readDiskInfo);
              var readDiskInfoStr = readDiskInfo.toString();
              if (readDiskInfo && readDiskInfoStr.length > 0) {
                var readDiskInfoJson = JSON.parse(readDiskInfoStr);
                self.showProress(readDiskInfoJson);
              }
            });
        }, 1000, 0, true); //1000:表示每隔1000毫秒去获取



        diskService.execDiskCopy(self.postStr).then(function(result) {
          //console.log('-------------------克隆完成后result:');
          //console.log(result);
          if (result && result.trim() == 'error') {
            console.log("克隆错误");
            $interval.cancel(self.diskCloneOP);
            self.cloneActivated = false;
            self.showDialog('克隆提示', '参数错误', '错误提示', '返回检查', function() {
              self.startCloneDisabled = false;
            });
          } else {
            var copyResult = JSON.parse(result);
            if (copyResult.status == 'success') {
              //进度条取消，提示克隆成功
              $interval.cancel(self.diskCloneOP);
              self.cloneActivated = false;
              self.showDialog('克隆提示', '克隆成功', '成功提示', '确认', function() {
                self.waitLoadUSB = true;
                self.determinateValue = 0;
                self.determinateValue += 20;
                self.waitLoadProgress = $interval(function() {
                  // Increment the Determinate loader
                  self.determinateValue += 1;
                  if (self.determinateValue >= 100) {
                    self.determinateValue = 30;
                  }
                }, 100, 0, true);
                //stop();
                //location.reload();
                loadUSBInfo({
                  icon: "avatar:svg-",
                  title: "/dev/",
                  background: "red",
                  capacity: "0",
                  useCapacity: "0",
                  unit: "G",
                  capacityDiff: "0",
                  realTitle: "",
                  currentDiskDetail: [],
                  realSize: 0
                });
                //初始化值
                self.startCloneDisabled = false;
                self.hash = false;
                if (self.diskSizeType) {
                  self.blockSize = self.diskSizeType[0];
                }
                self.selected = [];
                self.waitLoadUSB = false;
                $interval.clear(self.waitLoadProgress);

              });

            } else {
              $interval.cancel(self.diskCloneOP);
              self.cloneActivated = false;

              //克隆失败，请重试
              self.showDialog('克隆提示', '克隆时发生错误', '错误提示', '返回检查',
                function() {
                  self.startCloneDisabled = false;
                });

            }

          }
        });

      } catch (e) {
        console.log('克隆时发生错误:');
        console.log(e);
        self.showDialog('克隆提示', '克隆时发生错误', '错误提示', '请联系管理人员');
        $interval.cancel(self.diskCloneOP);
        self.cloneActivated = false;
      }
    };
    self.showDialog = function(title, content, label, oktip, callback) {
      $mdDialog.show(
        $mdDialog.alert()
        .clickOutsideToClose(true)
        .title(title)
        .textContent(content)
        .ariaLabel(label)
        .ok(oktip)
      ).finally(
        function() {
          callback();
        });
      return;
    };

    //重新加载USB信息
    function loadUSBInfo(tileTmpl) { //callback
      var it;
      self.usbValArr = [];
      self.usbArr = [];
      diskService.loadDiskList().then(function(disk) {
        if (!disk && !disk.list.node) {
          console.log('this computer is no disk or load error');
          return;
        }
        var usbData = disk['usbJsonData'];
        buildUSBData(usbData, tileTmpl);
      });
    }
    //构建内置硬盘信息
    function buildHardDiskData(expectUsbArr, tileTmpl, results) {
      if (expectUsbArr) {
        if (expectUsbArr && expectUsbArr.length >= 1) {
          for (var i = 0; i < expectUsbArr.length; i++) {
            var currentNode = expectUsbArr[i];
            if (currentNode.name && currentNode.children && currentNode.children
              .length >= 1) {
              it = angular.extend({}, tileTmpl);
              it.icon = it.icon + 'disk';
              it.span = {
                row: 1,
                col: 1
              };
              //硬盘详情
              it.diskData = currentNode;
              it.background = it.background;
              it.span.row = it.span.col = 3;
              //组装表格中需要显示的数据
              var detailData = {};

              if (currentNode.model) {
                detailData['description'] = currentNode.model;
              }

              if (currentNode.vendor) {
                it.product = currentNode.vendor;
                detailData['product'] = currentNode.vendor;
              }

              if (currentNode.serial) {
                it.serial = currentNode.serial;
                detailData['serial'] = currentNode.serial;
              }
              detailData['logicalname'] = it.title + currentNode.name.trim();
              if (currentNode.size) {
                detailData['size'] = currentNode.size;
              }

              if (currentNode.children && currentNode.children.length >
                0) {
                for (var cnode = 0; cnode < currentNode.children.length; cnode++) {
                  var subNode = currentNode.children[cnode];
                  if (subNode.serial && subNode.name) {
                    detailData[subNode.name + '.serial'] =
                      subNode.serial;
                  }
                  if (subNode.name) {
                    detailData[subNode.name + '.logicalname'] =
                      subNode.name;
                  }
                  if (subNode.size) {
                    detailData[subNode.name + '.size'] = subNode.size;
                  }
                  if (subNode.fstype && subNode.name) {
                    detailData[subNode.name + '.filesystem'] = subNode.fstype;
                  }
                }
              }

              var diskKeyArr = Object.keys(detailData);
              it.currentDiskDetail = [];
              for (var key in diskKeyArr) {
                var tempJson = {};
                tempJson['key'] = diskKeyArr[key];
                tempJson['value'] = detailData[diskKeyArr[key]];
                it.currentDiskDetail.push(tempJson);
              }
              it.title = it.title + currentNode.name;
              it.realTitle = it.title;
              if (it.title.length > 10) {
                it.title = it.title.substr(0, 10) + "...";
              }
              if (currentNode.size) {
                var diskNodeSize = currentNode.size / 1024 / 1024 /
                  1024;
                it.realSize = currentNode.size;
                it.capacity = diskNodeSize.toFixed(2);
              } else {
                it.capacity = 0;
              }
              results.push(it);
              //默认显示第一项
              if (i === 0 && it.diskData && it.title) {
                //self.detailData = it.diskData;
                self.detailData = [];
                self.detailData = it.currentDiskDetail;
                // console.log('self.detailData:');
                // console.log(self.detailData);
                self.showTitle = it.title;
                //硬盘操作默认选中第一个
                self.disks.push(it.realTitle);
                self.checkDiskSize = it.realSize;
              }
            }
          }
        }
      }
    }

    //构建usb信息
    function buildUSBData(usbData, tileTmpl) {
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
            var usbUserSpace = diskService.calcUSBSpace(it.realTitle);
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
            it.capacityDiff = (it.useCapacity / it.capacity * 100).toFixed(0);
            self.usbArr.push(it);
          }

        }
      }
    }
  }
})();
