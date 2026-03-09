const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  currentUser: () => ipcRenderer.invoke('auth:current'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  dashboardSummary: () => ipcRenderer.invoke('dashboard:summary'),
  list: (module) => ipcRenderer.invoke('crud:list', { module }),
  create: (module, data) => ipcRenderer.invoke('crud:create', { module, data }),
  update: (module, id, data) => ipcRenderer.invoke('crud:update', { module, id, data }),
  remove: (module, id) => ipcRenderer.invoke('crud:delete', { module, id }),
  exportExcel: (rows, fileName) => ipcRenderer.invoke('export:excel', { rows, fileName }),
  backupCreate: () => ipcRenderer.invoke('backup:create'),
  backupRestore: () => ipcRenderer.invoke('backup:restore'),
});
