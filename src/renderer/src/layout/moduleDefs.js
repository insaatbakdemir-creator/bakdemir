export const moduleDefs = {
  dashboard: { title: 'Dashboard' },
  companies: { title: 'Firma / Cari Yönetimi', fields: [{ key: 'code', label: 'Cari Kodu' }, { key: 'name', label: 'Firma Adı', required: true }, { key: 'type', label: 'Tür', required: true }, { key: 'phone', label: 'Telefon' }, { key: 'opening_balance', label: 'Açılış Bakiyesi', type: 'number' }] },
  projects: { title: 'Şantiye / Proje Yönetimi', fields: [{ key: 'code', label: 'Proje Kodu' }, { key: 'name', label: 'Proje Adı', required: true }, { key: 'location', label: 'Lokasyon' }, { key: 'status', label: 'Durum' }] },
  subcontractors: { title: 'Taşeron Yönetimi', fields: [{ key: 'name', label: 'Taşeron Adı', required: true }, { key: 'team_name', label: 'Ekip Adı' }, { key: 'phone', label: 'Telefon' }, { key: 'status', label: 'Durum' }] },
  employees: { title: 'Personel Yönetimi', fields: [{ key: 'full_name', label: 'Ad Soyad', required: true }, { key: 'role', label: 'Görev' }, { key: 'monthly_salary', label: 'Aylık Maaş', type: 'number' }, { key: 'status', label: 'Durum' }] },
  progressPayments: { title: 'Hakediş Yönetimi', fields: [{ key: 'payment_no', label: 'Hakediş No' }, { key: 'date', label: 'Tarih', type: 'date', required: true }, { key: 'gross_amount', label: 'Brüt', type: 'number', required: true }, { key: 'withholding_amount', label: 'Kesinti', type: 'number' }, { key: 'other_deductions', label: 'Diğer Kesintiler', type: 'number' }, { key: 'net_amount', label: 'Net', type: 'number', required: true }, { key: 'status', label: 'Durum' }] },
  transactions: { title: 'Avans ve Ödeme Takibi', fields: [{ key: 'type', label: 'Hareket Türü', required: true }, { key: 'date', label: 'Tarih', type: 'date', required: true }, { key: 'amount', label: 'Tutar', type: 'number', required: true }, { key: 'account_type', label: 'Kasa/Banka' }, { key: 'description', label: 'Açıklama' }] },
  payrolls: { title: 'Maaş Takibi', fields: [{ key: 'period', label: 'Dönem', required: true }, { key: 'employee_id', label: 'Personel ID', type: 'number', required: true }, { key: 'gross_salary', label: 'Brüt', type: 'number' }, { key: 'total_payable', label: 'Toplam Ödenecek', type: 'number' }, { key: 'payment_status', label: 'Durum' }] },
  expenses: { title: 'Gider Yönetimi', fields: [{ key: 'category', label: 'Gider Türü', required: true }, { key: 'date', label: 'Tarih', type: 'date', required: true }, { key: 'amount', label: 'Tutar', type: 'number', required: true }, { key: 'description', label: 'Açıklama' }] },
  materials: { title: 'Malzeme Takibi', fields: [{ key: 'material_item_id', label: 'Malzeme ID', type: 'number', required: true }, { key: 'type', label: 'Hareket Türü', required: true }, { key: 'date', label: 'Tarih', type: 'date', required: true }, { key: 'quantity', label: 'Miktar', type: 'number', required: true }, { key: 'total_amount', label: 'Toplam Tutar', type: 'number' }] },
  reminders: { title: 'Notlar / Hatırlatmalar', fields: [{ key: 'title', label: 'Başlık', required: true }, { key: 'description', label: 'Açıklama' }, { key: 'due_date', label: 'Vade', type: 'date' }, { key: 'status', label: 'Durum' }] },
  reports: { title: 'Raporlar', readOnly: true },
  users: { title: 'Kullanıcı Yetkilendirme', fields: [{ key: 'username', label: 'Kullanıcı Adı', required: true }, { key: 'password_hash', label: 'Parola Hash', required: true }, { key: 'role', label: 'Rol' }, { key: 'is_active', label: 'Aktif', type: 'number' }] },
  logs: { title: 'İşlem Geçmişi / Log', readOnly: true },
  backup: { title: 'Yedekleme / Geri Yükleme', readOnly: true },
};

export const menuItems = [
  'dashboard','companies','projects','subcontractors','employees','progressPayments','transactions','payrolls','materials','expenses','reports','backup','users','logs','reminders'
];
