
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

// IPC handler để lưu file vào thư mục userData/documents
ipcMain.handle('save-pdf', async (event, { fileName, base64Data }) => {
  try {
    const docsDir = path.join(app.getPath('userData'), 'documents');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    const filePath = path.join(docsDir, fileName);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    logToFile(`Saved PDF to: ${filePath}`);
    return { success: true, filePath: `file://${filePath}` };
  } catch (err) {
    logToFile(`Error saving PDF: ${err.message}`);
    return { success: false, error: err.message };
  }
});

function createWindow() {
  logToFile("Initializing Main Window...");
  
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: true, // Cho phép sử dụng IPC trong renderer
      contextIsolation: false,
      webSecurity: false, 
      devTools: true
    }
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media') return true;
    return false;
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') return callback(true);
    callback(false);
  });

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

  mainWindow.setMenuBarVisibility(false);
}

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
