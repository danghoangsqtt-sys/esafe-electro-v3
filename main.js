const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function logToFile(msg) {
  const logMsg = `[${new Date().toISOString()}] ${msg}\n`;
  const logPath = path.join(app.getPath('userData'), 'app-debug.log');
  console.log(logMsg.trim());
  try {
    fs.appendFileSync(logPath, logMsg);
  } catch (e) {
    console.error("Cannot write log:", e);
  }
}

function createWindow() {
  logToFile("Initializing Main Window...");
  
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Không hiển thị ngay để tránh nháy trắng
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      devTools: true
    }
  });

  // Tự động cấp quyền Media
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media') return true;
    return false;
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') return callback(true);
    callback(false);
  });

  const indexPath = path.join(__dirname, 'index.html');
  logToFile(`Loading file: ${indexPath}`);

  mainWindow.loadFile(indexPath).catch(err => {
    logToFile(`ERROR loading file: ${err.message}`);
  });

  // Chỉ hiển thị cửa sổ khi đã nạp xong khung html
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logToFile("Window shown to user.");
  });

  // Phím tắt mở DevTools để debug nhanh khi bị màn trắng
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.openDevTools();
      logToFile("DevTools opened by user shortcut (F12)");
    }
  });

  // Theo dõi lỗi nạp tài nguyên
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logToFile(`FAILED LOAD: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  logToFile("App Ready.");
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  logToFile("All windows closed.");
  if (process.platform !== 'darwin') app.quit();
});
