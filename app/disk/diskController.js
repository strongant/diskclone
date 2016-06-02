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
    self.hash = "";
    self.blockSize = "";
    //硬盘详细信息展示
    self.detailData = '点击左边硬盘显示详细信息';
    self.showTitle = '显示硬盘详情';
    //当前计算中的USB设备信息



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
      capacity: "100",
      useCapacity: "30",
      unit: "G",
      capacityDiff: "40"
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
        console.log('diskController - > getAllDisk:');
        //console.log(disk);
        var cdromData = disk['cdromJsonData'];
        var hardDiskData = disk['hardDiskJsonData'];
        var usbData = disk['usbJsonData'];

        //构造usb设备信息
        for (var j = 0; j < 6; j++) {
          for (var i = 0; i < usbData.length; i++) {
            var currentNode = usbData[i];
            console.log(currentNode);
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
            console.log(currentNode);

            if (currentNode.size) {
              var diskNodeSize = currentNode.size.$t / 1024 / 1024 / 1024;
              it.capacity = diskNodeSize.toFixed(2);
            } else {
              it.capacity = 0;
            }
            console.log(it);
            usbResults.push(it);
            self.usbArr = usbResults;
          }
        }


        var expectUsbArr = cdromData.concat(hardDiskData);

        //构造除过cdrom和usb的存储设备信息
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
          //console.log(currentNode);
          //  console.log(currentNode.logicalname[0]);
          //console.log(typeof currentNode.logicalname);
          if (typeof currentNode.logicalname == 'object') {
            it.title = currentNode.logicalname[0];
          } else if (typeof currentNode.logicalname == 'string') {
            it.title = currentNode.logicalname;
          }

          if (currentNode.size) {
            var diskNodeSize = currentNode.size.$t / 1024 / 1024 / 1024;
            it.capacity = diskNodeSize.toFixed(2);
          } else {
            it.capacity = 0;
          }
          results.push(it);
          //默认显示第一项
          if (i === 0 && it.diskData && it.title) {
            self.detailData = it.diskData;
            self.showTitle = it.title;
          }
        }
        //加载完毕取消等待消息
        $interval.cancel(stop);
        self.activated = false;
      });
      return results;
    }
    self.showCurrentDiskInfo = function(data, title) {
      console.log('showCurrentDiskInfo-->data:' + data);
      self.detailData = data;
      self.showTitle = title;
    };
    self.diskSizeType = [8, 16, 32];


    // self.toggle = function(item, list) {
    //   var idx = list.indexOf(item);
    //   if (idx > -1) {
    //     list.splice(idx, 1);
    //   } else {
    //     list.push(item);
    //   }
    // };
    //
    // self.exists = function(item, list) {
    //   return list.indexOf(item) > -1;
    // };
  }


})();
