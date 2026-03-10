import React from 'react';
import { OperationForm } from './OperationForms';

export function AvansOdemeKesintiPage({ companies, subcontractors, projects, onSaved }: any) {
  return (
    <div className="grid-forms-3">
      <OperationForm title="Ödeme Yap" type="ODEME" flow="GIDER" companies={companies} subcontractors={subcontractors} projects={projects} onSaved={onSaved} />
      <OperationForm title="Avans Ver" type="AVANS" flow="GIDER" companies={companies} subcontractors={subcontractors} projects={projects} onSaved={onSaved} />
      <OperationForm title="Kesinti Gir" type="KESINTI" flow="GIDER" companies={companies} subcontractors={subcontractors} projects={projects} onSaved={onSaved} />
      <OperationForm title="Tahsilat Gir" type="TAHSILAT" flow="GELIR" companies={companies} subcontractors={subcontractors} projects={projects} onSaved={onSaved} />
    </div>
  );
}
