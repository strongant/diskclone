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
      realSize: 0
    });



    //对加载到的硬盘进行格式化显示
    function buildGridModel(tileTmpl) {
      var it, results = [],
        usbResults = [];
      //diskService.loadDiskList();
      diskService.loadDiskList().then(function(disk) {
        if (!disk && !disk.list.node) {
          console.log('this computer is no disk or load error');
          return;
        }
        console.log('all disk:');
        console.log(disk);
        var cdromData = disk['cdromJsonData'];
        var hardDiskData = disk['hardDiskJsonData'];
        var usbData = disk['usbJsonData'];
        //显示USB信息
        buildUSBData(usbData, tileTmpl);
        //不显示cdrom
        var expectUsbArr = cdromData.concat(hardDiskData);
        //var expectUsbArr = hardDiskData;
        console.log(hardDiskData);

        //构造除过cdrom和usb的存储设备信息
        // for (var t = 0; t < 1; t++) {
        if (expectUsbArr) {
          for (var i = 0; i < expectUsbArr.length; i++) {
            var currentNode = expectUsbArr[i];
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
            console.log('hardDisk  currentNode:');
            console.log(currentNode);
            if (currentNode.description) {
              detailData['description'] = currentNode.description;
            }
            if (!currentNode.description && currentNode.node.description) {
              detailData['description'] = currentNode.node.description;
            }
            if (currentNode.product) {
              detailData['product'] = currentNode.product;
            }
            if (currentNode.node.logicalname) {
              detailData['logicalname'] = currentNode.node.logicalname;
            }

            if (currentNode.serial) {
              detailData['serial'] = currentNode.serial;
            }
            if (currentNode.node.size && currentNode.node.size._) {
              detailData['size'] = currentNode.node.size._;
            }
            if (currentNode.node.node && currentNode.node.node.length > 0) {
              for (var cnode = 0; cnode < currentNode.node.node.length; cnode++) {
                var subNode = currentNode.node.node[cnode];
                detailData[subNode.$.id + '.serial'] = subNode.serial;
                detailData[subNode.$.id + '.logicalname'] = subNode.logicalname;
                detailData[subNode.$.id + '.size'] = subNode.size._;
                if (subNode.configuration && subNode.configuration.setting) {
                  for (var subi = 0; subi < subNode.configuration.setting
                    .length; subi++) {
                    if (subNode.configuration.setting[subi].$.id ===
                      'filesystem') {
                      detailData[subNode.$.id + '.filesystem'] =
                        subNode.configuration
                        .setting[subi].$.value;
                    }
                  }
                }

              }
            }
            // console.log('detailData:');
            // console.log(typeof detailData);
            // console.log(detailData);
            var diskKeyArr = Object.keys(detailData);
            // console.log('diskKeyArr:');
            // console.log(diskKeyArr);
            it.currentDiskDetail = [];
            for (var key in diskKeyArr) {
              var tempJson = {};
              tempJson['key'] = diskKeyArr[key];
              tempJson['value'] = detailData[diskKeyArr[key]];
              it.currentDiskDetail.push(tempJson);
            }
            // console.log('it.currentDiskDetail:');
            // console.log(it.currentDiskDetail);

            //console.log(currentNode);
            //  console.log(currentNode.logicalname[0]);
            //console.log(typeof currentNode.logicalname);

            if (typeof currentNode.node.logicalname == 'object') {
              it.title = currentNode.node.logicalname[0];
            } else if (typeof currentNode.node.logicalname == 'string') {
              it.title = currentNode.node.logicalname;
            }
            it.realTitle = it.title;
            if (it.title.length > 10) {
              it.title = it.title.substr(0, 10) + "...";
            }

            if (currentNode.node && currentNode.node.size) {
              var diskNodeSize = currentNode.node.size._ / 1024 / 1024 /
                1024;
              it.realSize = currentNode.node.size._;

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
            // console.log('results:' + results.length);
            // console.log(results);
            // console.log('--------------------');
          }
        }


        //}
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
    self.startCopy = function() {

      console.log('vm.disks:');
      console.log(self.disks);
      console.log('vm.hash:');
      console.log(self.hash);
      console.log('vm.blockSize:');
      console.log(self.blockSize);
      console.log('self.selected:');
      console.log(self.selected);
      if (self.disks.length == 0) {
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

      //组织需要调用python文件的参数
      var checkedDiskSize = self.checkDiskSize; //单位为字节
      self.postData['sourceDisk'] = {
        "logicalName": self.disks[0],
        // "logicalName": '/dev/sr0',
        "size": {
          "value": checkedDiskSize,
          "units": "bytes"
        }
      };
      self.postData['targetFolder'] = self.selected;
      self.postData['isHash'] = self.hash;
      self.postData['blockSize'] = self.blockSize;
      self.postStr = JSON.stringify(self.postData);
      console.log('postStr:');
      console.log(self.postData);
      console.log(self.postStr);
      try {
        //var resultStr = diskService.execDiskCopy(postStr);
        //显示克隆进度条
        self.diskCloneOP = $interval(function() {
          self.determinateValue += 1;
          self.determinateValue2 += 1.5;
          if (self.determinateValue > 100) self.determinateValue = 10;
          if (self.determinateValue2 > 100) self.determinateValue2 =
            10;
        }, 100, 0, true);
        self.cloneActivated = true;
        self.startCloneDisabled = true;

        diskService.execDiskCopy(self.postStr).then(function(result) {
          console.log('-------------------克隆完成后result:');
          console.log(result);


          if (result && result.trim() == 'error') {
            //进度条取消，提示克隆成功
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
                self.determinateValue += 20;
                self.waitLoadProgress = $interval(function() {
                  // Increment the Determinate loader
                  self.determinateValue += 1;
                  if (self.determinateValue > 100) {
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
      // setTimeout(function() {
      //   location.reload();
      // }, 2000);
      return;
    };
    //间隔一段事件获取USB的传输情况
    // var queryUSBCacity = $interval(function() {
    //     // Increment the Determinate loader
    //     diskService.loadDiskList().then(function(disk) {
    //         var usbData = disk['usbJsonData'];
    //
    //     });
    // }, 1000, 0, true);


    //重新加载USB信息
    function loadUSBInfo(tileTmpl) {
      var it;
      self.usbValArr = [];
      self.usbArr = [];
      diskService.loadDiskList().then(function(disk) {
        if (!disk && !disk.list.node) {
          console.log('this computer is no disk or load error');
          return;
        }
        var usbData = disk['usbJsonData'];
        console.log(usbData.length);
        //组装usb信息
        buildUSBData(usbData, tileTmpl);
      });
    }

    function buildUSBData(usbData, tileTmpl) {
      if (usbData) {
        for (var i = 0; i < usbData.length; i++) {
          var currentNode = usbData[i];
          it = angular.extend({}, tileTmpl);
          it.icon = it.icon + 'usb';
          it.background = 'blue';
          it.span = {
            row: 1,
            col: 1
          };
          //usb详情
          it.diskData = currentNode;
          it.span.row = it.span.col = 3;

          if (typeof currentNode.node.node.logicalname == 'object') {
            it.title = currentNode.node.node.logicalname[0];
          } else if (typeof currentNode.node.node.logicalname == 'string') {
            it.title = currentNode.node.node.logicalname;
          }
          it.realTitle = it.title;
          //组装usb名称和logicalname
          if (currentNode.node.node && currentNode.node.node && currentNode.node
            .node.logicalname) {
            if (typeof currentNode.node.node.logicalname == 'object') {
              var usbLogicalNameIndex = currentNode.node.node.logicalname.length -
                1;
              var usbName = currentNode.node.node.logicalname[
                usbLogicalNameIndex];
              it.realTitle = usbName;
              console.log('usbName:');
              console.log(usbName);
              //计算USB剩余的存储空间

              var usbUserSpace = diskService.calcUSBSpace(it.realTitle);
              it.useCapacity = (usbUserSpace / 1000 / 1000).toFixed(1);

              var usbNameArr = usbName.split('/');
              var usbNameEndIndex = usbNameArr.length - 1;
              it.title = usbNameArr[usbNameEndIndex];
              self.usbValArr.push(it.realTitle);

            }
          }
          if (it.title.length > 15) {
            it.title = it.title.substr(0, 10) + "...";
          }
          console.log('usb:');
          console.log(currentNode);

          if (currentNode.node && currentNode.node.size && currentNode.node.size
            ._) {
            var diskNodeSize = currentNode.node.size._ / 1000 / 1000 /
              1000;
            it.capacity = diskNodeSize.toFixed(1);
          } else {
            it.capacity = 0;
          }
          //计算使用比例
          if (it.capacity && it.useCapacity && it.capacity > 0) {
            it.capacityDiff = (it.useCapacity / it.capacity * 100).toFixed(
              0);
          }

          self.usbArr.push(it);
        }
      }
    }



  }


})();
