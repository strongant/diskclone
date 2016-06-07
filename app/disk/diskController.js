(function() {


  angular.module('app')
    .controller('diskController', ['$scope', '$interval',
      'diskService', '$q',
      '$mdDialog',
      DiskController
    ]).config(function($mdIconProvider) {
      $mdIconProvider.iconSet("avatar",
        'assets/icons/avatar-icons.svg',
        128);
    });



  function DiskController($scope, $interval, diskService, $q,
    $mdDialog) {
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
        //console.log(disk);
        var cdromData = disk['cdromJsonData'];
        var hardDiskData = disk['hardDiskJsonData'];
        var usbData = disk['usbJsonData'];

        //构造usb设备信息
        for (var j = 0; j < 1; j++) {
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


            if (typeof currentNode.logicalname == 'object') {

              it.title = currentNode.logicalname[0];
            } else if (typeof currentNode.logicalname == 'string') {
              it.title = currentNode.logicalname;

            }
            it.realTitle = it.title;
            //组装usb名称和logicalname
            if (currentNode.node.logicalname) {
              if (typeof currentNode.node.logicalname == 'object') {
                var usbLogicalNameIndex = currentNode.node.logicalname.length -
                  1;
                var usbName = currentNode.node.logicalname[
                  usbLogicalNameIndex];
                it.realTitle = usbName;
                //计算USB剩余的存储空间
                var usbUserSpace = diskService.calcUSBSpace(usbName);
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

            if (currentNode.size) {
              var diskNodeSize = currentNode.size.$t / 1024 / 1024 /
                1024;
              it.capacity = diskNodeSize.toFixed(1);
            } else {
              it.capacity = 0;
            }
            //计算使用比例
            if (it.capacity && it.useCapacity && it.capacity > 0) {
              it.capacityDiff = (it.useCapacity / it.capacity * 100).toFixed(
                0);
            }
            usbResults.push(it);
            self.usbArr = usbResults;
          }
        }
        //不显示cdrom
        //var expectUsbArr = cdromData.concat(hardDiskData);
        var expectUsbArr = hardDiskData;

        //构造除过cdrom和usb的存储设备信息
        // for (var t = 0; t < 1; t++) {


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
          if (currentNode.product) {
            detailData['product'] = currentNode.product;
          }
          if (currentNode.logicalname) {
            detailData['logicalname'] = currentNode.logicalname;
          }
          if (currentNode.serial) {
            detailData['serial'] = currentNode.serial;
          }
          if (currentNode.size && currentNode.size.$t) {
            detailData['size'] = currentNode.size.$t;
          }
          if (currentNode.node && currentNode.node.length > 0) {
            for (var cnode = 0; cnode < currentNode.node.length; cnode++) {
              var subNode = currentNode.node[cnode];
              detailData[subNode.id + '.logicalname'] = subNode.logicalname;
              detailData[subNode.id + '.size'] = subNode.size.$t;
              if (subNode.configuration && subNode.configuration.setting) {
                for (var subi = 0; subi < subNode.configuration.setting
                  .length; subi++) {
                  if (subNode.configuration.setting[subi].id ===
                    'filesystem') {
                    detailData[subNode.id + '.filesystem'] = subNode.configuration
                      .setting[subi].value;
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
          if (typeof currentNode.logicalname == 'object') {
            it.title = currentNode.logicalname[0];

          } else if (typeof currentNode.logicalname == 'string') {
            it.title = currentNode.logicalname;
          }
          it.realTitle = it.title;
          if (it.title.length > 10) {
            it.title = it.title.substr(0, 10) + "...";
          }

          if (currentNode.size) {
            var diskNodeSize = currentNode.size.$t / 1024 / 1024 / 1024;
            it.realSize = currentNode.size.$t;
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
        //}
        //加载完毕取消等待消息
        $interval.cancel(stop);
        self.activated = false;
        //usb全选和不选操作
        self.selected = [];
        self.toggle = function(item, list) {
          var idx = list.indexOf(item);
          if (idx > -1) {
            list.splice(idx, 1);
          } else {
            list.push(item);
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
          if (self.selected.length === self.usbValArr.length) {
            self.selected = [];
          } else if (self.selected.length === 0 || self.selected.length >
            0) {
            self.selected = self.usbValArr.slice(0);
          }
        };

      });
      return results;
    }
    self.showCurrentDiskInfo = function(data, title, size) {
      //console.log('showCurrentDiskInfo---->data:' + data);
      //self.detailData = data;
      self.detailData = data;
      self.showTitle = title;
      self.disks = [];
      self.disks.push(realTitle);
      self.checkDiskSize = size;
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
      }
      if (self.blockSize === 0) {
        self.showDialog('克隆提示', '请选择块大小!', '操作提示', '返回选择');
      }
      if (self.selected.length == 0) {
        self.showDialog('克隆提示', '请至少选择一个USB进行硬盘克隆操作!', '操作提示', '返回选择');
      }

      //组织需要调用python文件的参数
      var checkedDiskSize = self.checkDiskSize; //单位为字节
      self.postData['sourceDisk'] = {
        "logicalName": self.disks[0],
        "size": {
          "value": checkedDiskSize,
          "units": "bytes"
        }
      };
      self.postData['targetFolder'] = self.selected;
      self.postData['isHash'] = self.hash;
      self.postData['blockSize'] = self.blockSize;
      var postStr = JSON.stringify(self.postData);
      console.log('postStr:');
      console.log(self.postData);
      console.log(postStr);
      try {
        var resultStr = diskService.execDiskCopy(postStr);
        if (resultStr && resultStr.trim() == 'error') {
          self.showDialog('克隆提示', '参数错误', '错误提示', '返回检查');
        } else {
          //显示克隆进度条

          var copyResult = JSON.parse(resultStr);
          if (copyResult.status === 'success') {
            //进度条取消，提示克隆成功

          } else {
            //进度条取消，提示克隆成功

            //克隆失败，请重试
            self.showDialog('克隆提示', '克隆时发生错误', '错误提示', '返回检查');
          }

        }
      } catch (e) {

      } finally {

      }


      // $mdDialog.show(
      //   $mdDialog.alert()
      //   .clickOutsideToClose(true)
      //   .title('克隆提示')
      //   .textContent('确定执行克隆操作码?')
      //   .ariaLabel('克隆提示')
      //   .ok('确定')
      // );
    }
    self.showDialog = function(title, content, label, oktip) {
      $mdDialog.show(
        $mdDialog.alert()
        .clickOutsideToClose(true)
        .title(title)
        .textContent(content)
        .ariaLabel(label)
        .ok(oktip)
      );
      return;
    }


  }


})();
