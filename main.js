const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;

let mainWindow;
let iconPath = __dirname + '/app/assets/img/appledisk.png';

const template = [{
  label: 'View',
  submenu: [{
    label: '刷新',
    accelerator: 'CmdOrCtrl+R',
    click(item, focusedWindow) {
      if (focusedWindow) focusedWindow.reload();
    }
  }, {
    label: '全屏',
    accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
    click(item, focusedWindow) {
      if (focusedWindow)
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
    }
  }, {
    label: '显示或隐藏开发者工具',
    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    click(item, focusedWindow) {
      if (focusedWindow)
        focusedWindow.webContents.toggleDevTools();
    }
  }, ]
}, {
  label: 'Window',
  role: 'window',
  submenu: [{
    label: '关闭',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }, ]
}, ];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

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
  //mainWindow.setFullScreen(true);
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
