// 获取依赖
var gulp = require('gulp'),
  childProcess = require('child_process'),
  electron = require('electron-prebuilt');
// 创建 gulp 任务
gulp.task('run', function() {
  childProcess.spawn(electron, ['--debug=5858', './main.js'], {
    stdio: 'inherit'
  });
});
