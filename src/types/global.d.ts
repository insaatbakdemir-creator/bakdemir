declare global {
  interface Window {
    dobiApi: {
      getMeta: () => Promise<{ appName: string; developer: string; version: string; offline: boolean }>;
      dashboard: () => Promise<Record<string, number>>;
      listProjects: () => Promise<Array<{ id: number; name: string }>>;
      listSubcontractors: () => Promise<Array<{ id: number; name: string }>>;
      listCompanies: () => Promise<Array<{ id: number; name: string }>>;
      listPersonnel: () => Promise<Array<{ id: number; full_name: string }>>;
      recentTransactions: () => Promise<any[]>;
      saveTransaction: (payload: any) => Promise<{ ok: boolean; errors?: any[] }>;
      reportSubcontractorLedger: (id: number) => Promise<{ ledger: any[]; summary: any }>;
      exportSubcontractorLedgerExcel: (id: number) => Promise<{ ok: boolean; filePath?: string; message?: string }>;
      printHtml: (html: string, title: string) => Promise<{ ok: boolean; message?: string }>;
    };
  }
}

export {};
