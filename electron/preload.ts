import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('dobiApi', {
  getMeta: () => ipcRenderer.invoke('app:getMeta'),
  dashboard: () => ipcRenderer.invoke('dashboard:getSummary'),
  listProjects: () => ipcRenderer.invoke('project:list'),
  listSubcontractors: () => ipcRenderer.invoke('subcontractor:list'),

  listSubcontractorManagement: () => ipcRenderer.invoke('subcontractor:managementList'),
  listTransactionsByType: (type: string, relatedPartyId: number) => ipcRenderer.invoke('transaction:listByType', type, relatedPartyId),
  projectFinancialSummary: (projectId: number) => ipcRenderer.invoke('project:financialSummary', projectId),

  listCompanies: () => ipcRenderer.invoke('company:list'),
  listPersonnel: () => ipcRenderer.invoke('personnel:list'),
  recentTransactions: () => ipcRenderer.invoke('transaction:recent'),
  saveTransaction: (payload: unknown) => ipcRenderer.invoke('transaction:create', payload),
  reportSubcontractorLedger: (id: number) => ipcRenderer.invoke('report:subcontractorLedger', id),
  exportSubcontractorLedgerExcel: (id: number) => ipcRenderer.invoke('report:subcontractorLedgerExcel', id),
  printHtml: (html: string, title: string) => ipcRenderer.invoke('print:html', { html, title })
});
