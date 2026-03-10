import React from 'react';
import { OperationForm } from './OperationForms';

export function HakedisYevmiyePage({ companies, subcontractors, projects, onSaved }: any) {
  return (
    <div className="split">
      <OperationForm title="Hakediş Ekle" type="HAKEDIS" flow="GIDER" companies={companies} subcontractors={subcontractors} projects={projects} onSaved={onSaved} />
      <OperationForm title="Yevmiye Ekle" type="YEVMIYE" flow="GIDER" companies={companies} subcontractors={subcontractors} projects={projects} onSaved={onSaved} />
    </div>
  );
}
