# Panduan Pengguna SI-PESAT

**Sistem Informasi Penatausahaan Kertas Kerja Audit Terintegrasi**
Inspektorat Kabupaten Sumba Barat

---

## Daftar Isi

1. [Sekilas Aplikasi](#1-sekilas-aplikasi)
2. [Persiapan & Login](#2-persiapan--login)
3. [Navigasi](#3-navigasi)
4. [Role & Hak Akses](#4-role--hak-akses)
5. [Manajemen Template (Jenis Audit)](#5-manajemen-template-jenis-audit)
6. [Membuat KKA Baru](#6-membuat-kka-baru)
7. [Workspace — Mengisi KKA](#7-workspace--mengisi-kka)
8. [Dokumen Bukti (Evidence)](#8-dokumen-bukti-evidence)
9. [Generator Dokumen](#9-generator-dokumen)
10. [Alur Review](#10-alur-review)
11. [Evaluasi & Asistensi](#11-evaluasi--asistensi)
12. [Dashboard & Statistik](#12-dashboard--statistik)
13. [Manajemen Pengguna](#13-manajemen-pengguna)
14. [Role & Permission](#14-role--permission)
15. [Log Aktivitas](#15-log-aktivitas)
16. [Pengaturan](#16-pengaturan)

---

## 1. Sekilas Aplikasi

SI-PESAT adalah aplikasi web untuk mengelola siklus penuh Kertas Kerja Audit (KKA) — mulai dari perencanaan, pelaksanaan lapangan, pengumpulan bukti, review pimpinan, hingga pemantauan tindak lanjut.

**Teknologi:** Aplikasi berbasis web (browser), tersimpan di cloud (Supabase PostgreSQL), dan bekerja offline dengan cadangan lokal. Dokumen bukti disimpan di Google Drive.

---

## 2. Persiapan & Login

### Login
1. Buka URL aplikasi (dari admin/operator)
2. Masukkan **Email** dan **Password** yang sudah didaftarkan
3. Klik **Masuk / Sign In**
4. Jika lupa password, hubungi admin untuk reset

### Keamanan
- Setelah 5 kali gagal login, akun terkunci selama 5 menit
- Admin dapat mengaktifkan **MFA (Autentikator Dua Langkah)** per pengguna di halaman Manajemen Pengguna

---

## 3. Navigasi

### Desktop
| Menu | Submenu | Akses |
|------|---------|-------|
| Beranda | — | Semua user |
| Wilayah Penugasan | — | Semua user |
| Pengawasan | KKA, Reviu, Evaluasi, Asistensi | Semua user |
| Pengaturan | Pengguna, Role & Permission, Log Aktivitas | Admin/Irban/Inspektur |

Tombol **"Mulai Pengawasan Baru"** di kanan atas → membuat KKA baru.

### Mobile
Bottom navigation: **Beranda | Pengawasan | Buat KKA | Profil | Lainnya**

Menu "Lainnya" berisi: Wilayah Penugasan, Statistik, Jenis Audit, Pengguna, Role & Permission, Log Aktivitas.

---

## 4. Role & Hak Akses

| Role | Hak Utama |
|------|----------|
| **Inspektur** | Akses penuh semua KKA, setujui/tolak review, kelola pengguna |
| **Inspektur Pembantu (Irban)** | Akses penuh KKA di wilayahnya, review, buat KKA |
| **Auditor Ahli** (Utama/Madya/Muda/Pertama) | Isi KKA, upload bukti, dapat menjadi Ketua Tim |
| **Auditor Penyelia / Pelaksana** | Isi KKA, upload bukti sebagai anggota tim |
| **PPUPD** | Sama seperti Auditor |
| **Admin** | Akses penuh + manajemen sistem, role, permission |

### Ketua Tim vs Anggota
- **Ketua Tim** (min. Auditor Ahli Muda/PPUPD Muda): bisa ajukan review
- **Anggota Tim**: hanya bisa mengisi dan upload bukti
- **Bukan anggota tim**: hanya baca

---

## 5. Manajemen Template (Jenis Audit)

> **Akses:** Inspektur, Irban, Admin

Template adalah kerangka jenis audit yang berisi daftar kategori dan item spesifikasi bukti.

### Membuka Halaman Template
- Desktop: **Pengawasan → KKA → Jenis Audit**
- Mobile: **Lainnya → Jenis Audit**

### Operasi Template
| Aksi | Cara |
|------|------|
| **Tambah Template** | Klik "Tambah Kelompok Audit" → isi nama → submit |
| **Tambah Kategori** | Pilih template → "Tambah Jenis" → isi nama & deskripsi → submit |
| **Edit Kategori** | Klik ikon edit pada kategori |
| **Tambah Item** | Pilih kategori → form "Tambah Kriteria Baru" → isi judul & deskripsi |
| **Hapus Item/Kategori** | Klik ikon hapus (minimum 1 item per kategori, 1 kategori per template) |

> **Catatan:** Template hanya sebagai patokan dasar. Di workspace, auditor tetap bisa menambah/mengurang item sesuai kebutuhan tanpa mengubah template asli.

---

## 6. Membuat KKA Baru

### Cara 1: Modal Cepat (dari halaman KKA)
1. Klik tombol **"Mulai KKA"** di pojok kanan atas halaman KKA
2. Isi: Nama Instansi/OPD, Tipe Objek, Tahun Anggaran, Kelompok Audit
3. Klik **"Mulai KKA"**

### Cara 2: Wizard Lengkap (dari tombol navigasi)
1. Klik **"Mulai Pengawasan Baru"** atau **"Buat KKA"**
2. Pilih template kelompok audit
3. Pilih kategori yang akan diperiksa (centang)
4. Atur jadwal milestone (tanggal target)
5. Klik **"Buat KKA"**

### Hasil
KKA baru muncul di halaman KKA dengan status **Draft**. Klik untuk masuk ke workspace.

---

## 7. Workspace — Mengisi KKA

Workspace adalah halaman utama untuk mengisi dan mengelola KKA.

### Komponen Workspace

#### A. Panel Kiri — Daftar Kategori
- Menampilkan semua kategori dalam KKA
- Klik kategori untuk beralih
- Progress bar per kategori
- Tombol "+" untuk tambah kategori baru (Irban/Inspektur)

#### B. Panel Kanan — Checklist Spesifikasi Bukti
Setiap kategori berisi daftar item spesifikasi. Per item:

| Elemen | Fungsi |
|--------|--------|
| **Judul & Deskripsi** | Nama spesifikasi dokumen |
| **Status** | **Sesuai** / **Temuan** / **N/A** |
| **Klasifikasi Temuan** | Jenis penyimpangan (dropdown) |
| **Nilai Temuan** | Nilai kerugian dalam Rupiah |
| **Uraian Temuan** | Detail penyimpangan |
| **Rekomendasi** | Saran tindak lanjut |
| **Evidence Panel** | Upload/tautan dokumen bukti |
| **Catatan Review** | Catatan dari pimpinan |

#### 🔄 Menambah Item Baru
1. Klik tombol **"+ Tambah Item"** di samping judul "Spesifikasi Bukti & Pertanggungjawaban"
2. Isi **Nama Dokumen** (wajib) dan **Deskripsi** (opsional)
3. Klik **Simpan**
4. Item baru muncul dengan status **N/A**
5. Item baru **tidak** mengubah template asli

#### 🔄 Drag-Reorder Item
- Seret ikon **⠿ (GripVertical)** di samping nomor dokumen untuk mengubah urutan
- Hanya aktif jika tidak sedang mencari (search kosong)

#### 🗑️ Menghapus Item
- Jika status **Temuan**: tombol hapus di bagian bawah detail temuan
- Jika status lain: tombol hapus di pojok kanan bawah card
- Konfirmasi "Ya" untuk menghapus

#### C. Panel Jadwal & Progress
- Milestone: Perencanaan → Pelaksanaan → Penyusunan Laporan → Pemantauan
- Atur tanggal target dan realisasi per tahap
- Progress terhitung otomatis dari jumlah dokumen bukti yang sudah diupload

---

## 8. Dokumen Bukti (Evidence)

Panel bukti ada di setiap item spesifikasi.

### Upload File
1. **Drag & drop** file ke area panel, atau klik area untuk pilih file
2. Atur nama file (opsional)
3. Klik **Upload**
4. File otomatis tersalin ke Google Drive pusat
5. Link tersimpan di item

**Format:** PDF, Excel, Word, JPG/PNG (max 15MB)

### Tautan Google Drive
1. Klik **"Tautkan dari URL"**
2. Paste link Google Drive
3. Atur nama dokumen
4. Klik **Tautkan**
5. File disalin ke folder Drive pusat

### Preview
- Klik **"Lihat"** untuk preview dokumen (iframe)
- Klik **"Salin Link"** untuk copy URL

### Riwayat
Panel menampilkan timeline: unggah, tautkan, hapus, ganti nama — lengkap dengan timestamp dan pelaku.

---

## 9. Generator Dokumen

Empat jenis dokumen bisa digenerate dari workspace.

### Cara Menggunakan
1. Di workspace, klik tombol generator (header kanan)
2. Isi/ubah field yang diperlukan
3. Klik **"Generate PDF"**
4. File PDF siap diunduh

### Jenis Dokumen
| Generator | Kegunaan |
|-----------|----------|
| **Sampul KKP** | Cover Kertas Kerja Pemeriksaan — atur header, tim, tanggal, ukuran font |
| **Surat Tugas** | Surat penugasan audit — atur nomor, dasar hukum, tim, maksud, waktu |
| **Nota Dinas** | Memo internal — kepada, dari, perihal, lampiran, pembuka |
| **SPPD** | Surat Perintah Perjalanan Dinas — maksud, tujuan, lama, tanggal, tim |

---

## 10. Alur Review

### Bagi Auditor (Ketua Tim)
1. Isi semua item spesifikasi sampai selesai
2. Upload dokumen bukti
3. Klik **"Ajukan Review"**
4. Status kategori → **Direview**
5. Notifikasi dikirim ke Irban/Inspektur
6. Tunggu persetujuan atau revisi

### Bagi Reviewer (Irban/Inspektur)
1. Dari menu **Pengawasan → Reviu**, lihat semua KKA yang perlu direview
2. Klik KKA → isi **Catatan Review** per item
3. Pilih:
   - **Setujui** → status kategori → **Selesai**
   - **Kembalikan Revisi** → status → **Sedang Berjalan**
4. Auditor mendapat notifikasi hasil review

---

## 11. Evaluasi & Asistensi

### Evaluasi
Menu **Pengawasan → Evaluasi** menampilkan KKA yang sudah **Selesai** atau **Sedang Berjalan** — untuk evaluasi pasca-audit dan pemantauan tindak lanjut.

### Asistensi
Menu **Pengawasan → Asistensi** menampilkan KKA dengan status **Draft** — untuk pendampingan dan asistensi teknis oleh Irban/Inspektur.

---

## 12. Dashboard & Statistik

### Beranda
Halaman awal yang menampilkan:
- Profil Inspektorat (tugas, visi, misi, struktur, wilayah)
- Tombol **Panduan Pengguna** untuk help

### Statistik
- **Pengawasan → KKA → Statistik KKA** (desktop)
- **Lainnya → Statistik** (mobile)

Menampilkan:
- Total KKA, KKA Final (Selesai), KKA Dalam Proses
- Grafik batang: status per tahun, tipe objek per tahun
- Grafik pie: sebaran temuan
- Tabel data: semua KKA dengan total temuan keuangan (dapat diurutkan)

### Wilayah Penugasan
Peta interaktif (Leaflet) dengan marker objek audit (OPD, Sekolah, Desa, Puskesmas). Filter berdasarkan bidang/wilayah.

---

## 13. Manajemen Pengguna

> **Akses:** Admin, Irban, Inspektur, atau permission `user.manage`

1. **Pengaturan → Pengguna**
2. Daftar semua pengguna dengan: Nama, Email, Role, NIP, Golongan, Pangkat, Status Admin, MFA
3. Filter: cari nama/email/NIP

### Operasi
| Aksi | Cara |
|------|------|
| **Tambah Pengguna** | Klik **"Tambah Pengguna"** → isi form → submit (user akan terima email undangan) |
| **Edit Pengguna** | Klik ikon edit pada baris pengguna |
| **Toggle Admin** | Klik tombol **Admin** untuk memberikan/mencabut status admin |
| **Toggle MFA** | Klik tombol **MFA** untuk mengaktifkan/menonaktifkan autentikator dua langkah |

---

## 14. Role & Permission

> **Akses:** Admin atau permission `role.manage`

Halaman **Pengaturan → Role & Permission** untuk mengelola hak akses per role.

Setiap permission memiliki scope:
- **`bidang`** — hanya data sesuai bidang/wilayah user
- **`all`** — seluruh data

---

## 15. Log Aktivitas

> **Akses:** Admin, Irban, Inspektur

**Pengaturan → Log Aktivitas** mencatat semua aksi penting:
- Login/logout user
- Buat/ubah/hapus KKA
- Ubah user, role, permission
- Hapus/reset template

Fitur: filter berdasarkan aksi, cari user, pagination.

---

## 16. Pengaturan

### Edit Profil OPD
Di workspace: klik ikon edit pada header OPD → ubah nama, tipe, TA, status.

### Edit Tim Kategori
Di workspace: klik ikon edit pada kategori → ganti Ketua Tim, anggota.

### Sinkronisasi
- Data tersimpan otomatis setiap 5 detik
- Ikon cloud di header workspace menampilkan status sinkronisasi
- Klik ikon untuk sync manual
- Konflik data terdeteksi otomatis (peringatan jika data diubah pengguna lain)

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| **Tidak bisa login** | Cek email/password, tunggu 5 menit jika terkunci, hubungi admin |
| **Data tidak muncul** | Refresh halaman, cek koneksi internet |
| **Upload file gagal** | Cek ukuran file (max 15MB), cek format file, cek koneksi Google Drive |
| **Data berubah sendiri** | Ada konflik dengan pengguna lain — sistem akan menampilkan data terbaru |
| **KKA tidak bisa diedit** | Status mungkin "Selesai" atau "Direview" — hubungi reviewer |
