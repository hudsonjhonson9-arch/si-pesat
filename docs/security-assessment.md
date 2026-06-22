# Security Assessment — SI-PESAT

**Tanggal:** 22 Juni 2026
**Versi:** 1.0

## Ringkasan

Dokumen ini berisi hasil assessment keamanan untuk SI-PESAT (Sistem Informasi Penatausahaan Kertas Kerja Audit Terintegrasi), aplikasi manajemen audit berbasis React + Supabase untuk Inspektorat Kabupaten Sumba Barat.

---

## Kerentanan Kritis (Telah Diperbaiki)

### 1. Row Level Security (RLS)

| Status | Detail |
|--------|--------|
| ✅ **Diperbaiki** | RLS aktif di seluruh 8 tabel |

**Kebijakan yang diterapkan:**
- **profiles** — pengguna baca/ubah profil sendiri, admin baca/ubah semua
- **audits** — akses untuk pembuat/anggota tim/admin, lainnya ditolak
- **templates** — terautentikasi baca, admin tulis
- **target_entities** — terautentikasi baca, admin tulis
- **roles / permissions / role_permissions / bidang** — terautentikasi baca, admin tulis

### 2. Google Apps Script — Akses Tanpa Autentikasi

| Status | Detail |
|--------|--------|
| ✅ **Diperbaiki** | Verifikasi JWT token via Supabase Auth API |

- Semua request upload wajib menyertakan `Authorization: Bearer <supabase_jwt>`
- Token diverifikasi ke `SUPABASE_URL/auth/v1/user`
- Identitas pengguna (email + ID) dicatat di deskripsi file Drive
- Request tanpa token valid ditolak (401)

### 3. Akses Control Berbasis Client-Side Saja

| Status | Detail |
|--------|--------|
| ✅ **Diperbaiki** | Semua state auth berasal dari Supabase session |

- Dihapus: semua `localStorage` read/write untuk `is_admin`, `user_role`, `session_active`
- Dihapus: fungsi `handleSessionLogin` (offline bypass)
- Role/permissions diambil dari tabel `profiles` setiap login

### 4. Alur Login

| Status | Detail |
|--------|--------|
| ✅ **Diperbaiki** | Cek role sebelum akses dashboard |

- Loading spinner tampil sampai role profil terkonfirmasi
- Tombol ganti dari "Masuk Sesi" menjadi "Masuk"

---

## Posisi Keamanan Saat Ini

### ✅ Terlindungi
| Area | Keterangan |
|------|------------|
| **RLS Database** | 8 tabel memiliki kebijakan RLS |
| **Autentikasi** | Supabase Auth (email/password + MFA opsional) |
| **Upload File** | Wajib JWT valid, identitas pengguna tercatat |
| **Otorisasi** | Diterapkan di server via RLS, tidak hanya client |

### ⚠️ Sedang (Lanjutan)
| Area | Keterangan |
|------|------------|
| **Kebijakan password** | Minimal 8 karakter, tanpa kompleksitas |
| **Rate limiting login** | Mengandalkan bawaan Supabase |
| **Leaked password protection** | Nonaktif — aktifkan via Dashboard Supabase |
| **Validasi file upload** | Hanya client-side (hint UI 10MB) |

### ℹ️ Catatan
- **Anon key Supabase** terekspos di client — ini desain bawaan Supabase SPA. Keamanan bertumpu pada RLS (sekarang sudah aktif).
- **File Google Drive** diset `ANYONE_WITH_LINK` — diperlukan untuk preview. File berada di folder Drive terpusat milik Inspektorat.

---

## Langkah Selanjutnya (Rekomendasi)

1. **Aktifkan Leaked Password Protection**
   - Dashboard Supabase → Authentication → Settings → Bot Protection
   - Cegah penggunaan password yang sudah bocor

2. **Tambah kompleksitas password**
   - Require huruf besar + angka + karakter khusus
   - File: `UserManagementView.tsx:126-128`

3. **Rate limiting**
   - Tambah pembatasan percobaan login gagal

4. **Validasi file server-side**
   - Tambah pengecekan ukuran file dan tipe MIME di Google Apps Script

5. **CSP Headers**
   - Tambah Content-Security-Policy di platform deployment (Vercel/Netlify)
