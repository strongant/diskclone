const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

var iconPath = __dirname + '/app/assets/img/appledisk.png';
// const appIcon = new Tray(
//   '/home/devbwh/study/electron/diskclone/app/assets/img/appledisk.png');
// var iconPath =
//   '/home/devbwh/study/electron/diskclone/app/assets/img/appledisk.png';
//let appIcon = new Tray('/Users/somebody/images/icon.png');


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 1000,
    icon: iconPath
  });

  mainWindow.loadURL(`file://${__dirname}/app/index.html`);


  mainWindow.webContents.openDevTools();


  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
