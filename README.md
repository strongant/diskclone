# Angular+Electron实现桌面硬盘克隆工具

First install or update your local project's **npm** tools:

```bash
# First install all the NPM tools:
npm install

# Or update
npm update
```
Then run the **bower**:

```bash
# To download `angular-material...` some files in the  `/bower_components` directory
bower  install
```
Then run the **gulp** tasks:

```bash
# To run `electron ./app/main.js` to start window or npm run start
gulp run
```
Build app
```bash
#To run `electron-packager . DiskClone --platform linux --arch x64 --version 1.1.3  --prune  --out=dist/ --overwrite  --icon =app/assets/img/appledisk.png --prune   --ignore=node_modules/electron-prebuilt --ignore=node_modules/electron-packager --ignore =.git` to generate curent path 'dist' directory
npm run build
```
Package app
```bash
#To run 'sudo zip -r d.zip dist/ && mv -f d.zip /tmp' zip app move to /tmp
npm run pack
```
View log file
```bash
cat /tmp/access.log
```
