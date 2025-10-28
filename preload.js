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
  dialog: {
    openFiles: (options) => ipcRenderer.invoke('dialog:openFiles', options),
  },
  shell: {
    openExternal: (url) => ipcRenderer.send('shell:openExternal', url),
  }
});