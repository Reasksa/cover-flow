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
  const templateSelect = document.getElementById('templateSelect');
  const captionInput = document.getElementById('caption');
  const hashtagSetSelect = document.getElementById('hashtagSetSelect');
  const hashtagsInput = document.getElementById('hashtags');
  const dropzone = document.getElementById('dropzone');
  const browseBtn = document.getElementById('browseBtn');
  const selectedFilesList = document.getElementById('selectedFiles');
  const queueNowBtn = document.getElementById('queueNowBtn');
  const youtubeUploadBtn = document.getElementById('youtubeUploadBtn');

  const queueList = document.getElementById('queueList');
  const scheduleAtInput = document.getElementById('scheduleAt');
  const repeatSelect = document.getElementById('repeatSelect');
  const scheduleBtn = document.getElementById('scheduleBtn');

  // Calendar
  const calendarEl = document.getElementById('calendar');
  const calendarMonthLabel = document.getElementById('calendarMonthLabel');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  let calendarDate = new Date();

  const openDataDirBtn = document.getElementById('openDataDirBtn');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const importDataBtn = document.getElementById('importDataBtn');
  const importDataInput = document.getElementById('importDataInput');

  // Library
  const libraryDropzone = document.getElementById('libraryDropzone');
  const libraryBrowseBtn = document.getElementById('libraryBrowseBtn');
  const libraryList = document.getElementById('libraryList');

  // Templates
  const tplName = document.getElementById('tplName');
  const tplContent = document.getElementById('tplContent');
  const tplAddBtn = document.getElementById('tplAddBtn');
  const tplList = document.getElementById('tplList');

  // Hashtags
  const hsName = document.getElementById('hsName');
  const hsTags = document.getElementById('hsTags');
  const hsAddBtn = document.getElementById('hsAddBtn');
  const hsList = document.getElementById('hsList');

  // Analytics
  const analyticsSummary = document.getElementById('analyticsSummary');

  // YouTube API settings
  const ytClientId = document.getElementById('ytClientId');
  const ytClientSecret = document.getElementById('ytClientSecret');
  const ytSaveBtn = document.getElementById('ytSaveBtn');
  const ytAuthBtn = document.getElementById('ytAuthBtn');

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
          <small class="muted">Scheduled ${new Date(job.scheduleAt).toLocaleString()} | Files: ${job.files.length} | Status: ${job.status} ${job.repeat && job.repeat !== 'none' ? '| Repeat: ' + job.repeat : ''}</small>
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
        await renderCalendar(); // keep calendar in sync
      });
      li.querySelector('[data-action="remove"]').addEventListener('click', async () => {
        await api.posting.remove(job.id);
        log(`Removed scheduled job ${job.id}`);
        await refreshQueue();
        await refreshOverview();
        await renderCalendar(); // keep calendar in sync
      });
      queueList.appendChild(li);
    });
    await renderCalendar();
    await renderAnalytics();
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

  async function refreshTemplates() {
    const templates = await api.templates.list();
    templateSelect.innerHTML = '<option value="">None</option>';
    tplList.innerHTML = '';
    templates.forEach(t => {
      const opt = document.createElement('option');
      opt.value = String(t.id);
      opt.textContent = t.name;
      templateSelect.appendChild(opt);

      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div><strong>${t.name}</strong></div>
          <small class="muted">${t.content.slice(0, 80)}${t.content.length > 80 ? '...' : ''}</small>
        </div>
        <div class="actions">
          <button data-action="use">Use</button>
          <button data-action="remove">Remove</button>
        </div>
      `;
      li.querySelector('[data-action="use"]').addEventListener('click', () => {
        captionInput.value = t.content;
        log(`Applied template ${t.name}`);
      });
      li.querySelector('[data-action="remove"]').addEventListener('click', async () => {
        await api.templates.remove(t.id);
        log(`Removed template ${t.name}`);
        await refreshTemplates();
      });
      tplList.appendChild(li);
    });
  }

  async function refreshHashtagSets() {
    const sets = await api.hashtags.list();
    hashtagSetSelect.innerHTML = '<option value="">None</option>';
    hsList.innerHTML = '';
    sets.forEach(s => {
      const opt = document.createElement('option');
      opt.value = String(s.id);
      opt.textContent = s.name;
      hashtagSetSelect.appendChild(opt);

      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div><strong>${s.name}</strong></div>
          <small class="muted">${(s.tags || []).join(' ')}</small>
        </div>
        <div class="actions">
          <button data-action="apply">Apply</button>
          <button data-action="remove">Remove</button>
        </div>
      `;
      li.querySelector('[data-action="apply"]').addEventListener('click', () => {
        hashtagsInput.value = (hashtagsInput.value + ' ' + (s.tags || []).join(' ')).trim();
        log(`Applied hashtag set ${s.name}`);
      });
      li.querySelector('[data-action="remove"]').addEventListener('click', async () => {
        await api.hashtags.remove(s.id);
        log(`Removed hashtag set ${s.name}`);
        await refreshHashtagSets();
      });
      hsList.appendChild(li);
    });
  }

  async function refreshLibrary() {
    const items = await api.library.list();
    libraryList.innerHTML = '';
    items.forEach(it => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div><strong>${it.name}</strong> <span class="muted">(${it.type})</span></div>
          <small class="muted">${it.path}</small>
        </div>
        <div class="actions">
          <button data-action="use">Use</button>
          <button data-action="remove">Remove</button>
        </div>
      `;
      li.querySelector('[data-action="use"]').addEventListener('click', () => {
        selectedFiles.push(it.path);
        renderSelectedFiles();
        log(`Added ${it.name} to selected files`);
      });
      li.querySelector('[data-action="remove"]').addEventListener('click', async () => {
        await api.library.remove(it.id);
        await refreshLibrary();
        log(`Removed ${it.name} from library`);
      });
      libraryList.appendChild(li);
    });
  }

  // Add template
  tplAddBtn.addEventListener('click', async () => {
    const name = tplName.value.trim();
    const content = tplContent.value.trim();
    if (!name || !content) {
      log('Template name and content required.');
      return;
    }
    await api.templates.add({ name, content });
    tplName.value = '';
    tplContent.value = '';
    await refreshTemplates();
    log(`Added template ${name}`);
  });

  // Add hashtag set
  hsAddBtn.addEventListener('click', async () => {
    const name = hsName.value.trim();
    const tags = hsTags.value.trim().split(/\s+/).filter(Boolean);
    if (!name) {
      log('Hashtag set name required.');
      return;
    }
    await api.hashtags.add({ name, tags });
    hsName.value = '';
    hsTags.value = '';
    await refreshHashtagSets();
    log(`Added hashtag set ${name}`);
  });

  // Library
  libraryDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    libraryDropzone.style.borderColor = '#667eea';
  });
  libraryDropzone.addEventListener('dragleave', () => {
    libraryDropzone.style.borderColor = '';
  });
  libraryDropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    libraryDropzone.style.borderColor = '';
    const files = Array.from(e.dataTransfer.files).map(f => ({ path: f.path, name: f.name }));
    await api.library.add(files);
    await refreshLibrary();
    log(`Added ${files.length} item(s) to library`);
  });

  libraryBrowseBtn.addEventListener('click', async () => {
    const result = await api.dialog.openFiles({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Media', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'] }
      ]
    });
    if (!result.canceled) {
      const files = result.filePaths.map(p => ({ path: p, name: p.split(/[\\/]/).pop() }));
      await api.library.add(files);
      await refreshLibrary();
      log(`Added ${files.length} item(s) to library`);
    }
  });

  // Template select apply
  templateSelect.addEventListener('change', async () => {
    const id = Number(templateSelect.value || 0);
    if (!id) return;
    const templates = await api.templates.list();
    const t = templates.find(tt => tt.id === id);
    if (t) {
      captionInput.value = t.content;
      log(`Applied template ${t.name}`);
    }
  });

  function combinedHashtags() {
    const extras = hashtagsInput.value.trim().split(/\s+/).filter(Boolean);
    const selectedId = Number(hashtagSetSelect.value || 0);
    return (async () => {
      if (!selectedId) return extras;
      const sets = await api.hashtags.list();
      const set = sets.find(s => s.id === selectedId);
      const base = set ? (set.tags || []) : [];
      return Array.from(new Set(base.concat(extras)));
    })();
  }

  queueNowBtn.addEventListener('click', async () => {
    const accountId = Number(postAccount.value || 0);
    const platform = postPlatform.value;
    const caption = captionInput.value.trim();
    const hashtags = await combinedHashtags();
    if (!accountId || !selectedFiles.length) {
      log('Please select an account and at least one media file.');
      return;
    }
    lastQueuedDraft = { accountId, platform, caption, hashtags, files: selectedFiles.slice() };
    await api.posting.queue({ ...lastQueuedDraft, scheduleAt: Date.now(), repeat: 'none' });
    selectedFiles = [];
    renderSelectedFiles();
    captionInput.value = '';
    hashtagsInput.value = '';
    templateSelect.value = '';
    hashtagSetSelect.value = '';
    await refreshQueue();
    await refreshOverview();
    log(`Queued post for ${platform}`);
  });

  // Direct YouTube Upload via API
  youtubeUploadBtn.addEventListener('click', async () => {
    const accountId = Number(postAccount.value || 0);
    const platform = postPlatform.value;
    if (platform !== 'youtube') {
      log('Direct upload is available for YouTube only.');
      return;
    }
    if (!accountId || !selectedFiles.length) {
      log('Select a YouTube account and a video file.');
      return;
    }
    try {
      const tags = await combinedHashtags();
      const res = await api.youtube.upload({
        accountId,
        filePath: selectedFiles[0],
        title: captionInput.value.trim() || 'Untitled',
        description: captionInput.value.trim() || '',
        tags,
        privacyStatus: 'private',
        scheduleAt: null
      });
      log(res.success ? `YouTube upload started (videoId: ${res.videoId || 'unknown'})` : `Upload failed: ${res.error}`);
    } catch (e) {
      log('Upload failed: ' + e.message);
    }
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
    const repeat = repeatSelect.value || 'none';
    await api.posting.queue({ ...lastQueuedDraft, scheduleAt, repeat });
    await refreshQueue();
    await refreshOverview();
    await renderCalendar();
    log('Scheduled post added');
  });

  // Settings
  openDataDirBtn.addEventListener('click', () => {
    api.shell.openExternal('file:///' + require('path').join(process.env.APPDATA || process.env.HOME || __dirname, 'Reaksaio'));
  });

  exportDataBtn.addEventListener('click', async () => {
    const data = {
      accounts: await api.accounts.list(),
      queue: await api.posting.list(),
      library: await api.library.list(),
      templates: await api.templates.list(),
      hashtagSets: await api.hashtags.list(),
      settings: await api.settings.get()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
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
      await api.store.set('library', data.library || []);
      await api.store.set('templates', data.templates || []);
      await api.store.set('hashtagSets', data.hashtagSets || []);
      if (data.settings) await api.settings.set(data.settings);
      log('Imported data');
      await refreshAccounts();
      await refreshQueue();
      await refreshLibrary();
      await refreshTemplates();
      await refreshHashtagSets();
      await refreshOverview();
    } catch (e) {
      log('Import failed: ' + e.message);
    }
  });

  ytSaveBtn.addEventListener('click', async () => {
    const cid = ytClientId.value.trim();
    const sec = ytClientSecret.value.trim();
    if (!cid || !sec) {
      log('Enter YouTube OAuth Client ID and Secret.');
      return;
    }
    await api.youtube.configure(cid, sec);
    log('Saved YouTube API credentials.');
  });

  ytAuthBtn.addEventListener('click', async () => {
    const accountId = Number(postAccount.value || 0);
    if (!accountId) {
      log('Select a YouTube account (Accounts tab or Uploads -> Account).');
      return;
    }
    try {
      await api.youtube.auth(accountId);
      log('Opened YouTube authentication in browser. Complete the flow then return here.');
    } catch (e) {
      log('Auth failed: ' + e.message);
    }
  });

  // Calendar rendering
  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }
  function weekdayIndex(d) {
    return d.getDay(); // 0-6 starting Sunday
  }
  async function renderCalendar() {
    const queue = await api.posting.list();
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    calendarMonthLabel.textContent = monthStart.toLocaleString(undefined, { month: 'long', year: 'numeric' });

    const beforeDays = weekdayIndex(monthStart);
    const totalDays = monthEnd.getDate();
    const afterDays = (7 - ((beforeDays + totalDays) % 7)) % 7;
    const totalCells = beforeDays + totalDays + afterDays;

    calendarEl.innerHTML = '';
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'day';
      let dayNumber = i - beforeDays + 1;
      if (i < beforeDays || dayNumber > totalDays) {
        cell.classList.add('empty');
        calendarEl.appendChild(cell);
        continue;
      }
      const cellDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), dayNumber);
      const dateEl = document.createElement('div');
      dateEl.className = 'date';
      dateEl.textContent = dayNumber;
      cell.appendChild(dateEl);

      // Click-to-schedule: clicking the day will prefill scheduleAt and, if a draft exists, schedule it at 09:00
      cell.addEventListener('click', async () => {
        const pref = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 9, 0, 0);
        scheduleAtInput.value = new Date(pref.getTime() - pref.getTimezoneOffset() * 60000).toISOString().slice(0,16); // local datetime-local
        if (lastQueuedDraft) {
          await api.posting.queue({ ...lastQueuedDraft, scheduleAt: pref.getTime() });
          log(`Scheduled draft for ${pref.toLocaleString()}`);
          await refreshQueue();
          await refreshOverview();
          await renderCalendar();
        } else {
          log('No draft available. Prepare a post in Uploads, then click a calendar day to schedule.');
        }
      });

      const jobsForDay = queue.filter(j => {
        const jd = new Date(j.scheduleAt);
        return jd.getFullYear() === cellDate.getFullYear()
          && jd.getMonth() === cellDate.getMonth()
          && jd.getDate() === cellDate.getDate();
      });

      jobsForDay.forEach(j => {
        const jobEl = document.createElement('div');
        jobEl.className = 'job';
        jobEl.textContent = `${new Date(j.scheduleAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${j.platform}`;
        jobEl.title = j.caption;
        jobEl.addEventListener('click', async () => {
          const res = await api.posting.run(j.id);
          log(res.success ? `Opened posting page for ${j.platform}` : `Posting failed: ${res.error}`);
          await refreshQueue();
          await refreshOverview();
          await renderCalendar();
        });
        cell.appendChild(jobEl);
      });

      calendarEl.appendChild(cell);
    }
  }

  async function renderAnalytics() {
    const queue = await api.posting.list();
    const totals = {};
    const statuses = { posted: 0, failed: 0, queued: 0 };
    queue.forEach(q => {
      totals[q.platform] = (totals[q.platform] || 0) + 1;
      statuses[q.status] = (statuses[q.status] || 0) + 1;
    });
    const parts = [
      `Total queued: ${queue.length}`,
      `Posted: ${statuses.posted || 0}`,
      `Failed: ${statuses.failed || 0}`
    ];
    for (const [plat, n] of Object.entries(totals)) {
      parts.push(`${plat}: ${n}`);
    }
    analyticsSummary.textContent = parts.join(' • ');
  }

  prevMonthBtn.addEventListener('click', async () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
    await renderCalendar();
  });
  nextMonthBtn.addEventListener('click', async () => {
    calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
    await renderCalendar();
  });

  // Init
  (async function init() {
    const settings = await api.settings.get();
    ytClientId.value = settings.youtubeClientId || '';
    ytClientSecret.value = settings.youtubeClientSecret || '';

    await refreshAccounts();
    await refreshQueue();
    await refreshOverview();
    await refreshLibrary();
    await refreshTemplates();
    await refreshHashtagSets();
    await renderCalendar();
  })();
})();