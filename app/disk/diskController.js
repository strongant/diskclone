(function() {


  angular.module('app')
    .controller('diskController', ['$scope', '$interval', 'diskService', '$q',
      '$mdDialog',
      DiskController
    ]).config(function($mdIconProvider) {
      $mdIconProvider.iconSet("avatar",
        'assets/icons/avatar-icons.svg',
        128);
    });



  function DiskController($scope, $interval, diskService, $q, $mdDialog) {
    var self = this,
      j = 0,
      counter = 0;
    self.activated = true;
    self.determinateValue = 30;

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
      var it, results = [];
      diskService.loadDiskList().then(function(disk) {
        if (!disk && !disk.list.node) {
          console.log('this computer is no disk or load error');
          return;
        }
        console.log('diskController - > getAllDisk:');
        console.log(disk);
        var count = Object.keys(disk.list.node).length;
        console.log(count);
        var key, diskListNode = disk.list.node;
        var diskKeys = Object.keys(diskListNode);
        for (var i = 0; i < 5; i++) {
          for (key in diskKeys) {
            it = angular.extend({}, tileTmpl);
            it.icon = it.icon + 'disk';
            it.span = {
              row: 1,
              col: 1
            };
            it.background = it.background;
            it.span.row = it.span.col = 3;
            if (typeof diskListNode[key].logicalname === 'string') {
              console.log(diskListNode[key].logicalname);
              var keyString = diskListNode[key].logicalname;
              it.title = keyString;
            } else if (typeof diskListNode[key].logicalname === 'object') {
              var keys = diskListNode[key].logicalname;
              var keyArr = keys[0];
              console.log('arrs:' + keyArr);
              it.title = keyArr;
            }
            if (diskListNode[key].size) {
              console.log(diskListNode[key].size);
              if (Object.keys(diskListNode[key].size)) {
                var diskNodeKey = Object.keys(diskListNode[key].size)[0];
                var diskNodeSize = diskListNode[key].size[diskNodeKey] /
                  1024 /
                  1024 / 1024;
                console.log('disk size:' + diskNodeSize.toFixed(2));
                it.capacity = diskNodeSize.toFixed(2);
              }


            }
            results.push(it);
          }
        }
        //加载完毕取消等待消息
        $interval.cancel(stop);
        self.activated = false;
      });
      return results;
    }
  }


})();