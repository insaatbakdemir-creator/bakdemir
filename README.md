# DOBİ (Desktop)

Windows öncelikli, tamamen offline çalışan inşaat taşeronluk operasyon yönetim uygulaması.

## Teknoloji
- Electron + React + TypeScript
- SQLite (better-sqlite3)
- Excel rapor export (exceljs)
- Yazdırma (Electron `webContents.print`)

## Modüller (MVP)
- Dashboard kritik özet kartları
- Hızlı finans hareketi (hakediş, yevmiye, avans, ödeme, kesinti, tahsilat)
- Taşeron hesap ekstresi
- Excel export (başlık + format + kolon düzeni)
- Yazdırılabilir taşeron hesap özeti

## Veritabanı
Ana tablolar:
- `companies`
- `projects`
- `subcontractors`
- `personnel`
- `promissory_notes`
- `transactions`
- `subcontractor_balance_view`

Taşeron kalan alacak formülü SQL view içinde uygulanır:
`hakediş + yevmiye - avans - ödeme - kesinti - malzeme kesintisi - ekipman kesintisi`

## Çalıştırma
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
