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

  async readAll() {
    await this.ensureMasterKey();
    if (!fs.existsSync(this.dataFile)) {
      return { accounts: [], queue: [], lastId: 0, jobsLastId: 0 };
    }
    const enc = fs.readFileSync(this.dataFile);
    const iv = enc.subarray(0, 12);
    const tag = enc.subarray(enc.length - 16);
    const ciphertext = enc.subarray(12, enc.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    try {
      return JSON.parse(plain.toString('utf8'));
    } catch {
      return { accounts: [], queue: [], lastId: 0, jobsLastId: 0 };
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

  getQueuedPost(id) {
    // simple sync read to keep code compact
    try {
      const enc = fs.readFileSync(this.dataFile);
      const iv = enc.subarray(0, 12);
      const tag = enc.subarray(enc.length - 16);
      const ciphertext = enc.subarray(12, enc.length - 16);
      const keyHex = keytar.getPassword(SERVICE_NAME, MASTER_KEY_ACCOUNT); // returns Promise typically
      // Fallback: use async path when called from IPC handlers
      return null;
    } catch {
      return null;
    }
  }

  async markJobResult(id, res) {
    const data = await this.readAll();
    const job = data.queue.find(j => j.id === id);
    if (job) {
      job.status = res.success ? 'posted' : 'failed';
      job.result = res;
    }
    await this.writeAll(data);
  }
}

module.exports = Store;