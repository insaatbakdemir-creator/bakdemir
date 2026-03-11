import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('dobiApi', {
  getMeta: () => ipcRenderer.invoke('app:getMeta'),
  dashboard: () => ipcRenderer.invoke('dashboard:getSummary'),

  listCompanies: () => ipcRenderer.invoke('company:list'),
  createCompany: (payload: unknown) => ipcRenderer.invoke('company:create', payload),
  listCompanyBalances: () => ipcRenderer.invoke('company:balances'),

  listSubcontractors: () => ipcRenderer.invoke('subcontractor:list'),
  createSubcontractor: (payload: unknown) => ipcRenderer.invoke('subcontractor:create', payload),
  listSubcontractorManagement: () => ipcRenderer.invoke('subcontractor:managementList'),

  listProjects: () => ipcRenderer.invoke('project:list'),
  createProject: (payload: unknown) => ipcRenderer.invoke('project:create', payload),
  projectFinancialSummary: (projectId: number) => ipcRenderer.invoke('project:financialSummary', projectId),

  listPersonnel: () => ipcRenderer.invoke('personnel:list'),

  recentTransactions: () => ipcRenderer.invoke('transaction:recent'),
  saveTransaction: (payload: unknown) => ipcRenderer.invoke('transaction:create', payload),
  listTransactionsByType: (type: string, relatedPartyId: number) => ipcRenderer.invoke('transaction:listByType', type, relatedPartyId),

  listModuleEntries: (moduleKey: string) => ipcRenderer.invoke('module-entry:list', moduleKey),
  createModuleEntry: (payload: unknown) => ipcRenderer.invoke('module-entry:create', payload),
  deleteModuleEntry: (id: number) => ipcRenderer.invoke('module-entry:delete', id),

  reportSubcontractorLedger: (id: number) => ipcRenderer.invoke('report:subcontractorLedger', id),
  exportSubcontractorLedgerExcel: (id: number) => ipcRenderer.invoke('report:subcontractorLedgerExcel', id),
  printHtml: (html: string, title: string) => ipcRenderer.invoke('print:html', { html, title })
});
