(function() {
  angular.module('app')
    .controller('diskController', ['diskService', '$q', '$mdDialog',
      DiskController
    ]).config(function($mdIconProvider) {
      $mdIconProvider.iconSet("avatar",
        'assets/icons/avatar-icons.svg',
        128);
    });


  function DiskController($scope, diskService, $q, $mdDialog) {
    this.tiles = buildGridModel({
      icon: "avatar:svg-",
      title: "/dev/",
      background: ""
    });

    function buildGridModel(tileTmpl) {
      var it, results = [];
      for (var j = 0; j < 1; j++) {
        it = angular.extend({}, tileTmpl);
        it.icon = it.icon + 'disk';
        it.title = it.title + 'sda1';
        it.span = {
          row: 1,
          col: 1
        };
        switch (j + 1) {
          case 1:
            it.background = "red";
            it.span.row = it.span.col = 3;
            break;
        }
        results.push(it);
      }
      return results;
    }
    var self = this;
    self.loadDisk = loadDisk;
    //加载当前系统中的所有分区
    function loadDisk() {

    }
  }


})();
