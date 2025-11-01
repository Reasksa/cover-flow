const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('reaksaio', {
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
  },
  accounts: {
    list: () => ipcRenderer.invoke('accounts:list'),
    add: (account) => ipcRenderer.invoke('accounts:add', account),
    remove: (id) => ipcRenderer.invoke('accounts:remove', id),
    login: (id) => ipcRenderer.invoke('accounts:login', { id }),
  },
  posting: {
    queue: (job) => ipcRenderer.invoke('posting:queue', job),
    list: () => ipcRenderer.invoke('posting:queue:list'),
    remove: (id) => ipcRenderer.invoke('posting:queue:remove', id),
    run: (id) => ipcRenderer.invoke('posting:run', id),
  },
  library: {
    list: () => ipcRenderer.invoke('library:list'),
    add: (files) => ipcRenderer.invoke('library:add', files),
    remove: (id) => ipcRenderer.invoke('library:remove', id),
  },
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    add: (tpl) => ipcRenderer.invoke('templates:add', tpl),
    remove: (id) => ipcRenderer.invoke('templates:remove', id),
  },
  hashtags: {
    list: () => ipcRenderer.invoke('hashtags:list'),
    add: (set) => ipcRenderer.invoke('hashtags:add', set),
    remove: (id) => ipcRenderer.invoke('hashtags:remove', id),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (partial) => ipcRenderer.invoke('settings:set', partial),
  },
  youtube: {
    configure: (clientId, clientSecret) => ipcRenderer.invoke('youtube:configure', { clientId, clientSecret }),
    auth: (accountId) => ipcRenderer.invoke('youtube:auth', { accountId }),
    upload: (payload) => ipcRenderer.invoke('youtube:upload', payload),
  },
  dialog: {
    openFiles: (options) => ipcRenderer.invoke('dialog:openFiles', options),
  },
  shell: {
    openExternal: (url) => ipcRenderer.send('shell:openExternal', url),
  }
});