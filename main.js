const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('./storage/store');
const Automation = require('./automation/chrome');
const { autoUpdater } = require('electron-updater');

let mainWindow;
const store = new Store();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'Reaksaio'
  });

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Optional: Open dev tools during development
  // mainWindow.webContents.openDevTools();

  // AutoUpdater (disabled by default, can be enabled later by configuring feed)
  autoUpdater.autoDownload = false;

  // Simple scheduler loop: check every 30 seconds for due jobs and open posting pages
  setInterval(async () => {
    try {
      const queue = await store.getQueue();
      const now = Date.now();
      const due = queue.filter(j => j.status === 'queued' && j.scheduleAt <= now);
      for (const job of due) {
        const res = await Automation.post(job);
        await store.markJobResult(job.id, res);
        mainWindow && mainWindow.webContents.send('activity', { type: 'job-run', jobId: job.id, success: res.success });
      }
    } catch (e) {
      // swallow errors to keep loop running
    }
  }, 30000);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On Windows and Linux, quit when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Re-create a window when dock icon is clicked (macOS)
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers

ipcMain.handle('store:get', async (_event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', async (_event, key, value) => {
  return store.set(key, value);
});

ipcMain.handle('accounts:list', async () => {
  return store.getAccounts();
});

ipcMain.handle('accounts:add', async (_event, account) => {
  await store.addAccount(account);
  return store.getAccounts();
});

ipcMain.handle('accounts:remove', async (_event, id) => {
  await store.removeAccount(id);
  return store.getAccounts();
});

ipcMain.handle('accounts:login', async (_event, { id }) => {
  const account = await store.getAccount(id);
  if (!account) throw new Error('Account not found');
  return Automation.login(account.platform);
});

ipcMain.handle('posting:queue', async (_event, job) => {
  await store.queuePost(job);
  return store.getQueue();
});

ipcMain.handle('posting:queue:list', async () => {
  return store.getQueue();
});

ipcMain.handle('posting:queue:remove', async (_event, id) => {
  await store.removeQueuedPost(id);
  return store.getQueue();
});

ipcMain.handle('posting:run', async (_event, jobId) => {
  const job = await store.getQueuedPost(jobId);
  if (!job) throw new Error('Job not found');
  const res = await Automation.post(job);
  await store.markJobResult(jobId, res);
  return res;
});

ipcMain.handle('dialog:openFiles', async (_event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options || {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Media', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'] }
    ]
  });
  return result;
});

ipcMain.on('shell:openExternal', (_event, url) => {
  shell.openExternal(url);
});