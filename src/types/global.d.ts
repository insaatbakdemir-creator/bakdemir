declare global {
  interface Window {
    dobiApi: {
      getMeta: () => Promise<{ appName: string; developer: string; version: string; offline: boolean }>;
      dashboard: () => Promise<Record<string, number>>;

      listCompanies: () => Promise<any[]>;
      createCompany: (payload: any) => Promise<{ ok: boolean; errors?: any[] }>;
      listCompanyBalances: () => Promise<any[]>;

      listSubcontractors: () => Promise<any[]>;
      createSubcontractor: (payload: any) => Promise<{ ok: boolean; errors?: any[] }>;
      listSubcontractorManagement: () => Promise<any[]>;

      listProjects: () => Promise<any[]>;
      createProject: (payload: any) => Promise<{ ok: boolean; errors?: any[] }>;
      projectFinancialSummary: (projectId: number) => Promise<any>;

      listPersonnel: () => Promise<any[]>;

      recentTransactions: () => Promise<any[]>;
      saveTransaction: (payload: any) => Promise<{ ok: boolean; errors?: any[] }>;
      listTransactionsByType: (type: string, relatedPartyId: number) => Promise<any[]>;

      listModuleEntries: (moduleKey: string) => Promise<any[]>;
      createModuleEntry: (payload: any) => Promise<{ ok: boolean; errors?: any[] }>;
      deleteModuleEntry: (id: number) => Promise<{ ok: boolean }>;

      reportSubcontractorLedger: (id: number) => Promise<{ ledger: any[]; summary: any }>;
      exportSubcontractorLedgerExcel: (id: number) => Promise<{ ok: boolean; filePath?: string; message?: string }>;
      printHtml: (html: string, title: string) => Promise<{ ok: boolean; message?: string }>;
    };
  }
}

export {};
