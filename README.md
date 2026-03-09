# Santiyem (Geçici Proje Adı)

Tamamen offline çalışan, Electron + React + SQLite tabanlı inşaat/taşeron yönetim uygulaması.

## Mimari Özeti
- **Electron Main Process:** Pencere yönetimi, SQLite erişimi, yedekleme/geri yükleme, Excel export.
- **Preload Layer:** Güvenli IPC API köprüsü (`window.api`).
- **Renderer (React):** Sol menülü sade arayüz, dashboard, modül bazlı CRUD ekranları.
- **SQLite Veri Katmanı:** İlişkisel şema, seed data, activity log.

## Klasör Yapısı
- `src/main`: Electron ana süreç kodu
- `src/preload`: IPC API köprüsü
- `src/renderer`: React arayüzü
  - `src/components`: tekrar kullanılabilir bileşenler
  - `src/modules`: ekranlar
  - `src/layout`: menü ve modül tanımları
  - `src/utils`: format/helper fonksiyonları

## Desteklenen Modüller (İlk Sürüm)
1. Dashboard
2. Firma/Cari Yönetimi
3. Şantiye/Proje Yönetimi
4. Taşeron Yönetimi
5. Personel Yönetimi
6. Hakediş Yönetimi
7. Avans ve Ödeme Takibi
8. Maaş Takibi
9. Malzeme Takibi
10. Gider Yönetimi
11. Raporlar (özet)
12. Excel'e Aktarma (tüm listeler)
13. Yedekleme / Geri Yükleme
14. Kullanıcı Girişi & Rol
15. İşlem Geçmişi / Log
16. Notlar / Hatırlatmalar
17. Evrak ekleri için `attachments` şema altyapısı
18. Puantaj için `attendance_records` şema altyapısı

## Veritabanı Tabloları
`users, companies, projects, subcontractors, employees, payrolls, attendance_records, progress_payments, financial_transactions, expenses, cash_accounts, bank_accounts, material_items, material_transactions, reminders, activity_logs, attachments, settings`

## İş Kuralları (Uygulanan Temel Mantık)
- Dashboard finans özetleri transaction tiplerine göre hesaplanır.
- Hakediş net tutarı, brüt ve kesinti alanları ile saklanır.
- Personel maaş modülü net/toplam ödenebilir alanları destekler.
- Kasa/Banka bakiyesi: açılış + hareketlerin etkisi.
- Tüm CRUD işlemleri loglanır.

## Güvenlik ve Kullanılabilirlik
- Basit login sistemi (varsayılan admin kullanıcı)
- Zorunlu alan kontrolleri (form bazlı)
- Silme öncesi onay
- Hızlı arama ve liste filtreleme
- Türkçe arayüz, açık tema

## Seed Data
İlk açılışta örnek:
- admin kullanıcı (`admin / admin123`)
- örnek firma, proje, taşeron, personel, kasa/banka

## Kurulum
```bash
npm install
```

## Geliştirme (Windows dahil)
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Windows Installer (NSIS)
```bash
npm run pack:win
```

## Notlar / Varsayımlar
- Bu ilk sürümde tüm modüller çalışır CRUD altyapısında ve temel raporlama özetleri vardır.
- İleri sürümde: detaylı yetki matrisi, PDF/bordro çıktıları, gelişmiş filtre builder, attachment UI.
