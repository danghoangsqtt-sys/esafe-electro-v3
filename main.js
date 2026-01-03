
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
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, 
      devTools: true
    }
  });

  // Tự động cấp quyền Media cho Vấn đáp AI
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media') return true;
    return false;
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') return callback(true);
    callback(false);
  });

  // Xử lý sự cố nạp tệp
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logToFile(`FAILED TO LOAD CONTENT: ${errorCode} - ${errorDescription}`);
  });

  // --- QUAN TRỌNG: CHỈNH SỬA ĐƯỜNG DẪN NẠP FILE ---
  // Kiểm tra nếu app đã đóng gói (Packaged) thì nạp từ thư mục dist
  const isPackaged = app.isPackaged;
  const indexPath = isPackaged 
    ? path.join(__dirname, 'dist', 'index.html') 
    : path.join(__dirname, 'index.html');
    
  logToFile(`Loading interface from: ${indexPath} (Packaged: ${isPackaged})`);
  
  mainWindow.loadFile(indexPath).catch(err => {
    logToFile(`CRITICAL ERROR: Could not load index.html at ${indexPath}. ${err.message}`);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logToFile("Application Window is now visible.");
  });

  // Phím tắt Debug
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.openDevTools();
      logToFile("DevTools toggled by user (F12)");
    }
  });

  mainWindow.setMenuBarVisibility(false);
}

app.commandLine.appendSwitch('ignore-certificate-errors');

app.whenReady().then(() => {
  logToFile("System Kernel Ready.");
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  logToFile("Application shutting down.");
  if (process.platform !== 'darwin') app.quit();
});
