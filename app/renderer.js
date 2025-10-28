(function () {
  const api = window.reaksaio;

  // Tabs
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const views = Array.from(document.querySelectorAll('.view'));
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(tt => tt.classList.remove('active'));
      t.classList.add('active');
      const target = t.getAttribute('data-target');
      views.forEach(v => v.classList.toggle('active', v.id === target));
    });
  });

  // Elements
  const linkedCount = document.getElementById('linkedCount');
  const queuedCount = document.getElementById('queuedCount');
  const nextScheduled = document.getElementById('nextScheduled');
  const activityLog = document.getElementById('activityLog');

  const accountsList = document.getElementById('accountsList');
  const addAccountBtn = document.getElementById('addAccountBtn');
  const platformSelect = document.getElementById('platformSelect');
  const displayNameInput = document.getElementById('displayName');

  const postAccount = document.getElementById('postAccount');
  const postPlatform = document.getElementById('postPlatform');
  const captionInput = document.getElementById('caption');
  const hashtagsInput = document.getElementById('hashtags');
  const dropzone = document.getElementById('dropzone');
  const browseBtn = document.getElementById('browseBtn');
  const selectedFilesList = document.getElementById('selectedFiles');
  const queueNowBtn = document.getElementById('queueNowBtn');

  const queueList = document.getElementById('queueList');
  const scheduleAtInput = document.getElementById('scheduleAt');
  const scheduleBtn = document.getElementById('scheduleBtn');

  const openDataDirBtn = document.getElementById('openDataDirBtn');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const importDataBtn = document.getElementById('importDataBtn');
  const importDataInput = document.getElementById('importDataInput');

  // State
  let selectedFiles = [];
  let lastQueuedDraft = null;

  // Helpers
  function log(msg) {
    const li = document.createElement('li');
    li.textContent = `${new Date().toLocaleString()} - ${msg}`;
    activityLog.prepend(li);
  }

  async function refreshOverview() {
    const accounts = await api.accounts.list();
    const queue = await api.posting.list();
    linkedCount.textContent = accounts.length;
    queuedCount.textContent = queue.length;
    if (queue.length) {
      const next = queue.sort((a, b) => a.scheduleAt - b.scheduleAt)[0];
      nextScheduled.textContent = new Date(next.scheduleAt).toLocaleString();
    } else {
      nextScheduled.textContent = '-';
    }
  }

  async function refreshAccounts() {
    const accounts = await api.accounts.list();
    accountsList.innerHTML = '';
    postAccount.innerHTML = '<option value="">Select...</option>';
    accounts.forEach(acc => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div><strong>${acc.displayName}</strong> <span class="muted">(${acc.platform})</span></div>
          <small class="muted">Added ${new Date(acc.createdAt).toLocaleString()}</small>
        </div>
        <div class="actions">
          <button data-action="login">Login</button>
          <button data-action="remove">Remove</button>
        </div>
      `;
      li.querySelector('[data-action="login"]').addEventListener('click', async () => {
        try {
          await api.accounts.login(acc.id);
          log(`Opened login flow for ${acc.displayName}`);
        } catch (e) {
          log(`Login error: ${e}`);
        }
      });
      li.querySelector('[data-action="remove"]').addEventListener('click', async () => {
        await api.accounts.remove(acc.id);
        log(`Removed account ${acc.displayName}`);
        await refreshAccounts();
        await refreshOverview();
      });
      accountsList.appendChild(li);

      const opt = document.createElement('option');
      opt.value = acc.id;
      opt.textContent = `${acc.displayName} (${acc.platform})`;
      postAccount.appendChild(opt);
    });
  }

  async function refreshQueue() {
    const queue = await api.posting.list();
    queueList.innerHTML = '';
    queue.forEach(job => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div><strong>${job.platform}</strong> — ${job.caption.slice(0, 50)}${job.caption.length > 50 ? '...' : ''}</div>
          <small class="muted">Scheduled ${new Date(job.scheduleAt).toLocaleString()} | Files: ${job.files.length} | Status: ${job.status}</small>
        </div>
        <div class="actions">
          <button data-action="run">Run Now</button>
          <button data-action="remove">Remove</button>
        </div>
      `;
      li.querySelector('[data-action="run"]').addEventListener('click', async () => {
        const res = await api.posting.run(job.id);
        log(res.success ? `Opened posting page for ${job.platform}` : `Posting failed: ${res.error}`);
        await refreshQueue();
        await refreshOverview();
      });
      li.querySelector('[data-action="remove"]').addEventListener('click', async () => {
        await api.posting.remove(job.id);
        log(`Removed scheduled job ${job.id}`);
        await refreshQueue();
        await refreshOverview();
      });
      queueList.appendChild(li);
    });
  }

  // Accounts
  addAccountBtn.addEventListener('click', async () => {
    const platform = platformSelect.value;
    const displayName = displayNameInput.value.trim() || platform;
    await api.accounts.add({ platform, displayName });
    await refreshAccounts();
    await refreshOverview();
    log(`Added account ${displayName}`);
  });

  // Uploads
  function renderSelectedFiles() {
    selectedFilesList.innerHTML = '';
    selectedFiles.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f;
      selectedFilesList.appendChild(li);
    });
  }

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#667eea';
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '';
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '';
    const files = Array.from(e.dataTransfer.files).map(f => f.path);
    selectedFiles = selectedFiles.concat(files);
    renderSelectedFiles();
  });

  browseBtn.addEventListener('click', async () => {
    const result = await api.dialog.openFiles({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Media', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'] }
      ]
    });
    if (!result.canceled) {
      selectedFiles = selectedFiles.concat(result.filePaths);
      renderSelectedFiles();
    }
  });

  queueNowBtn.addEventListener('click', async () => {
    const accountId = Number(postAccount.value || 0);
    const platform = postPlatform.value;
    const caption = captionInput.value.trim();
    const hashtags = hashtagsInput.value.trim().split(/\s+/).filter(Boolean);
    if (!accountId || !selectedFiles.length) {
      log('Please select an account and at least one media file.');
      return;
    }
    lastQueuedDraft = { accountId, platform, caption, hashtags, files: selectedFiles.slice() };
    await api.posting.queue({ ...lastQueuedDraft, scheduleAt: Date.now() });
    selectedFiles = [];
    renderSelectedFiles();
    captionInput.value = '';
    hashtagsInput.value = '';
    await refreshQueue();
    await refreshOverview();
    log(`Queued post for ${platform}`);
  });

  // Scheduler
  scheduleBtn.addEventListener('click', async () => {
    if (!lastQueuedDraft) {
      log('Prepare a post first in Uploads tab, then schedule it.');
      return;
    }
    const dtStr = scheduleAtInput.value;
    if (!dtStr) {
      log('Select a date/time to schedule.');
      return;
    }
    const scheduleAt = new Date(dtStr).getTime();
    await api.posting.queue({ ...lastQueuedDraft, scheduleAt });
    await refreshQueue();
    await refreshOverview();
    log('Scheduled post added');
  });

  // Settings
  openDataDirBtn.addEventListener('click', () => {
    api.shell.openExternal('file:///' + require('path').join(process.env.APPDATA || process.env.HOME || __dirname, 'Reaksaio'));
  });

  exportDataBtn.addEventListener('click', async () => {
    const data = {
      accounts: await api.accounts.list(),
      queue: await api.posting.list()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    // In Electron renderer, we can open the URL to download
    const a = document.createElement('a');
    a.href = url;
    a.download = `reaksaio-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log('Exported data');
  });

  importDataBtn.addEventListener('click', () => importDataInput.click());
  importDataInput.addEventListener('change', async () => {
    const file = importDataInput.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      await api.store.set('accounts', data.accounts || []);
      await api.store.set('queue', data.queue || []);
      log('Imported data');
      await refreshAccounts();
      await refreshQueue();
      await refreshOverview();
    } catch (e) {
      log('Import failed: ' + e.message);
    }
  });

  // Init
  (async function init() {
    await refreshAccounts();
    await refreshQueue();
    await refreshOverview();
  })();
})();