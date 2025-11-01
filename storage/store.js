const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const keytar = require('keytar');

const SERVICE_NAME = 'Reaksaio';
const MASTER_KEY_ACCOUNT = 'master-key';

class Store {
  constructor() {
    this.baseDir = path.join(process.env.APPDATA || process.env.HOME || __dirname, 'Reaksaio');
    this.dataFile = path.join(this.baseDir, 'data.enc');
    this.ensureBaseDir();
    this.masterKey = null;
  }

  ensureBaseDir() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  getBaseDir() {
    return this.baseDir;
  }

  async ensureMasterKey() {
    if (this.masterKey) return this.masterKey;
    let key = await keytar.getPassword(SERVICE_NAME, MASTER_KEY_ACCOUNT);
    if (!key) {
      key = crypto.randomBytes(32).toString('hex');
      await keytar.setPassword(SERVICE_NAME, MASTER_KEY_ACCOUNT, key);
    }
    this.masterKey = Buffer.from(key, 'hex');
    return this.masterKey;
  }

  defaults() {
    return {
      accounts: [],
      queue: [],
      lastId: 0,
      jobsLastId: 0,
      library: [],
      templates: [],
      hashtagSets: [],
      settings: {
        youtubeClientId: '',
        youtubeClientSecret: ''
      },
      oauthTokens: {} // key: `${provider}:${accountId}` => token object
    };
  }

  async readAll() {
    await this.ensureMasterKey();
    if (!fs.existsSync(this.dataFile)) {
      return this.defaults();
    }
    const enc = fs.readFileSync(this.dataFile);
    const iv = enc.subarray(0, 12);
    const tag = enc.subarray(enc.length - 16);
    const ciphertext = enc.subarray(12, enc.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    try {
      const data = JSON.parse(plain.toString('utf8'));
      const def = this.defaults();
      // Merge defaults for any missing keys
      for (const k of Object.keys(def)) {
        if (typeof data[k] === 'undefined') data[k] = def[k];
      }
      return data;
    } catch {
      return this.defaults();
    }
  }

  async writeAll(data) {
    await this.ensureMasterKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    const buf = Buffer.from(JSON.stringify(data), 'utf8');
    const enc = Buffer.concat([cipher.update(buf), cipher.final()]);
    const tag = cipher.getAuthTag();
    const out = Buffer.concat([iv, enc, tag]);
    fs.writeFileSync(this.dataFile, out);
  }

  async get(key) {
    const data = await this.readAll();
    return data[key];
  }

  async set(key, value) {
    const data = await this.readAll();
    data[key] = value;
    await this.writeAll(data);
    return true;
  }

  // Accounts
  async getAccounts() {
    const data = await this.readAll();
    return data.accounts;
  }

  async getAccount(id) {
    const data = await this.readAll();
    return data.accounts.find(a => a.id === id) || null;
  }

  async addAccount(account) {
    const data = await this.readAll();
    const id = ++data.lastId;
    data.accounts.push({ id, platform: account.platform, displayName: account.displayName || account.platform, createdAt: Date.now() });
    await this.writeAll(data);
    return id;
  }

  async removeAccount(id) {
    const data = await this.readAll();
    data.accounts = data.accounts.filter(a => a.id !== id);
    await this.writeAll(data);
  }

  // Queue
  async queuePost(job) {
    const data = await this.readAll();
    const id = ++data.jobsLastId;
    data.queue.push({
      id,
      platform: job.platform,
      accountId: job.accountId,
      files: job.files || [],
      caption: job.caption || '',
      hashtags: job.hashtags || [],
      scheduleAt: job.scheduleAt || Date.now(),
      repeat: job.repeat || 'none', // none|daily|weekly|monthly
      status: 'queued',
      result: null,
      createdAt: Date.now()
    });
    await this.writeAll(data);
    return id;
  }

  async removeQueuedPost(id) {
    const data = await this.readAll();
    data.queue = data.queue.filter(q => q.id !== id);
    await this.writeAll(data);
  }

  async getQueue() {
    const data = await this.readAll();
    return data.queue.sort((a, b) => a.scheduleAt - b.scheduleAt);
  }

  async getQueuedPost(id) {
    const data = await this.readAll();
    return data.queue.find(q => q.id === id) || null;
  }

  async markJobResult(id, res) {
    const data = await this.readAll();
    const job = data.queue.find(j => j.id === id);
    if (job) {
      job.status = res.success ? 'posted' : 'failed';
      job.result = res;
      // If repeating and successful, schedule next occurrence
      if (res.success && job.repeat && job.repeat !== 'none') {
        const current = new Date(job.scheduleAt);
        let next;
        if (job.repeat === 'daily') {
          next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, current.getHours(), current.getMinutes(), current.getSeconds());
        } else if (job.repeat === 'weekly') {
          next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7, current.getHours(), current.getMinutes(), current.getSeconds());
        } else if (job.repeat === 'monthly') {
          next = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate(), current.getHours(), current.getMinutes(), current.getSeconds());
        }
        if (next) {
          job.scheduleAt = next.getTime();
          job.status = 'queued';
          job.result = null;
        }
      }
    }
    await this.writeAll(data);
  }

  // Library
  async listLibrary() {
    const data = await this.readAll();
    return data.library;
  }

  async addToLibrary(files) {
    const data = await this.readAll();
    for (const f of files) {
      const id = ++data.jobsLastId; // reuse counter for unique IDs
      data.library.push({
        id,
        path: f.path || f,
        name: f.name || path.basename(f.path || f),
        type: (f.type) || (/\.(mp4|mov)$/i.test(f.path || f) ? 'video' : 'image'),
        tags: f.tags || [],
        addedAt: Date.now()
      });
    }
    await this.writeAll(data);
    return true;
  }

  async removeFromLibrary(id) {
    const data = await this.readAll();
    data.library = data.library.filter(i => i.id !== id);
    await this.writeAll(data);
  }

  // Templates
  async listTemplates() {
    const data = await this.readAll();
    return data.templates;
  }

  async addTemplate(tpl) {
    const data = await this.readAll();
    const id = ++data.jobsLastId;
    data.templates.push({ id, name: tpl.name, content: tpl.content, createdAt: Date.now() });
    await this.writeAll(data);
    return id;
  }

  async removeTemplate(id) {
    const data = await this.readAll();
    data.templates = data.templates.filter(t => t.id !== id);
    await this.writeAll(data);
  }

  // Hashtag sets
  async listHashtagSets() {
    const data = await this.readAll();
    return data.hashtagSets;
  }

  async addHashtagSet(set) {
    const data = await this.readAll();
    const id = ++data.jobsLastId;
    data.hashtagSets.push({ id, name: set.name, tags: set.tags || [], createdAt: Date.now() });
    await this.writeAll(data);
    return id;
  }

  async removeHashtagSet(id) {
    const data = await this.readAll();
    data.hashtagSets = data.hashtagSets.filter(s => s.id !== id);
    await this.writeAll(data);
  }

  // Settings
  async getSettings() {
    const data = await this.readAll();
    return data.settings || {};
  }

  async setSettings(partial) {
    const data = await this.readAll();
    data.settings = { ...(data.settings || {}), ...partial };
    await this.writeAll(data);
    return data.settings;
  }

  // OAuth tokens
  async setOAuthToken(provider, accountId, tokens) {
    const data = await this.readAll();
    const key = `${provider}:${accountId}`;
    data.oauthTokens[key] = tokens;
    await this.writeAll(data);
    return true;
  }

  async getOAuthToken(provider, accountId) {
    const data = await this.readAll();
    const key = `${provider}:${accountId}`;
    return data.oauthTokens[key] || null;
  }
}

module.exports = Store;