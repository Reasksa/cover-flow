const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const Store = require('./storage/store');
const Automation = require('./automation/chrome');
const YouTube = require('./integrations/youtube');
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
        let res;
        // Direct YouTube upload if OAuth configured; otherwise, fall back to automation
        if (job.platform === 'youtube') {
          const tokens = await store.getOAuthToken('youtube', job.accountId);
          if (tokens && job.files && job.files.length) {
            try {
              res = await YouTube.uploadVideo({
                accountId: job.accountId,
                filePath: job.files[0],
                title: job.caption || 'Untitled',
                description: job.caption || '',
                tags: job.hashtags || [],
                privacyStatus: 'private',
                scheduleAt: job.scheduleAt
              });
              res = { success: true, ...res };
            } catch (e) {
              res = { success: false, error: String(e) };
            }
          } else {
            res = await Automation.post(job);
          }
        } else {
          res = await Automation.post(job);
        }
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

// Accounts
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

// Posting & Queue
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
  let res;
  if (job.platform === 'youtube') {
    const tokens = await store.getOAuthToken('youtube', job.accountId);
    if (tokens && job.files && job.files.length) {
      try {
        res = await YouTube.uploadVideo({
          accountId: job.accountId,
          filePath: job.files[0],
          title: job.caption || 'Untitled',
          description: job.caption || '',
          tags: job.hashtags || [],
          privacyStatus: 'private',
          scheduleAt: job.scheduleAt
        });
        res = { success: true, ...res };
      } catch (e) {
        res = { success: false, error: String(e) };
      }
    } else {
      res = await Automation.post(job);
    }
  } else {
    res = await Automation.post(job);
  }
  await store.markJobResult(jobId, res);
  return res;
});

// Library
ipcMain.handle('library:list', async () => {
  return store.listLibrary();
});
ipcMain.handle('library:add', async (_event, files) => {
  await store.addToLibrary(files);
  return store.listLibrary();
});
ipcMain.handle('library:remove', async (_event, id) => {
  await store.removeFromLibrary(id);
  return store.listLibrary();
});

// Templates
ipcMain.handle('templates:list', async () => {
  return store.listTemplates();
});
ipcMain.handle('templates:add', async (_event, tpl) => {
  await store.addTemplate(tpl);
  return store.listTemplates();
});
ipcMain.handle('templates:remove', async (_event, id) => {
  await store.removeTemplate(id);
  return store.listTemplates();
});

// Hashtag sets
ipcMain.handle('hashtags:list', async () => {
  return store.listHashtagSets();
});
ipcMain.handle('hashtags:add', async (_event, set) => {
  await store.addHashtagSet(set);
  return store.listHashtagSets();
});
ipcMain.handle('hashtags:remove', async (_event, id) => {
  await store.removeHashtagSet(id);
  return store.listHashtagSets();
});

// Settings
ipcMain.handle('settings:get', async () => {
  return store.getSettings();
});
ipcMain.handle('settings:set', async (_event, partial) => {
  return store.setSettings(partial);
});

// YouTube integrations
ipcMain.handle('youtube:configure', async (_event, { clientId, clientSecret }) => {
  return YouTube.configure(clientId, clientSecret);
});
ipcMain.handle('youtube:auth', async (_event, { accountId }) => {
  const { url } = await YouTube.startAuthFlow(accountId);
  shell.openExternal(url);
  return { success: true };
});
ipcMain.handle('youtube:upload', async (_event, payload) => {
  return YouTube.uploadVideo(payload);
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