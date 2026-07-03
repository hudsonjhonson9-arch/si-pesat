import React, { useState } from 'react';
import { ChevronDown, FileCheck, Building, BarChart3, User, Settings, PieChart, FolderSync, TrendingDown, Cloud, School, PlusCircle, ShieldAlert, Clock, MapPin } from 'lucide-react';

const sections = [
  {
    id: 'beranda',
    icon: <BarChart3 className="w-4 h-4" />,
    title: 'Beranda',
    content: `Halaman utama setelah login. Menampilkan informasi profil Inspektorat Kabupaten Sumba Barat:
• Tugas & Fungsi — gambaran tugas pengawasan internal
• Visi & Misi — arah dan tujuan organisasi
• Struktur Organisasi — susunan Inspektur, Sekretariat, dan Irban wilayah
• Wilayah Kerja — cakupan 6 kecamatan, 35 OPD, dan sekolah-sekolah
• Komitmen Mutu — pengawasan berbasis risiko dan kode etik APIP`
  },
  {
    id: 'wilayah-penugasan',
    icon: <MapPin className="w-4 h-4" />,
    title: 'Wilayah Penugasan',
    content: `Menampilkan peta dan daftar objek pengawasan berdasarkan wilayah (kecamatan, desa, OPD, sekolah, puskesmas) yang menjadi tanggung jawab Irban Wilayah IV.
Fitur:
• Peta interaktif Google Maps untuk navigasi wilayah
• Daftar OPD / Sekolah / Puskesmas per kecamatan
• Filter berdasarkan tipe objek (SD, SMP, Kecamatan, Dinas, dll)
• Klik item untuk melihat status audit`
  },
  {
    id: 'pengawasan',
    icon: <School className="w-4 h-4" />,
    title: 'Menu Pengawasan',
    subsections: [
      {
        id: 'kka',
        icon: <FileCheck className="w-4 h-4" />,
        title: 'KKA (Kertas Kerja Audit)',
        content: `Pusat pengelolaan Kertas Kerja Audit per OPD / instansi.

Fitur utama:
• Daftar KKA — kartu grup per OPD dengan stat (Jenis, Selesai, Berjalan, Draft, Temuan)
• Cari — filter nama OPD, auditor
• Filter Tipe Objek — SD, SMP, Dinas, Kecamatan, dll
• Filter Tahun Anggaran
• Progress Bar — visual status setiap kategori audit
• Hapus KKA — untuk Admin / Inspektur / Irban
• Inisiasi KKA Baru — modal cepat dari tombol di atas daftar

Cara pakai:
1. Pilih KKA yang ingin dikerjakan → masuk ke workspace
2. Di workspace: isi item audit per kategori
3. Tandai status item: Sesuai, Temuan (dengan nilai), atau N/A
4. Upload bukti dokumen pendukung
5. Kategori selesai → ubah status ke "Selesai"`
      },
      {
        id: 'reviu',
        icon: <FolderSync className="w-4 h-4" />,
        title: 'Reviu',
        content: `Menu untuk mereviu KKA yang sudah selesai dikerjakan oleh auditor.
• Lihat seluruh kategori dan item audit
• Beri catatan reviu
• Tandai status reviu`
      },
      {
        id: 'evaluasi',
        icon: <TrendingDown className="w-4 h-4" />,
        title: 'Evaluasi',
        content: `Menu evaluasi dari hasil pengawasan.
• Pantau tindak lanjut temuan
• Evaluasi efektivitas pengawasan`
      },
      {
        id: 'asistensi',
        icon: <Cloud className="w-4 h-4" />,
        title: 'Asistensi',
        content: `Menu asistensi dan pendampingan.
• Bimbingan teknis kepada OPD
• Pendampingan pengelolaan keuangan daerah`
      }
    ]
  },
  {
    id: 'statistik',
    icon: <PieChart className="w-4 h-4" />,
    title: 'Statistik',
    content: `Visualisasi data pengawasan dalam bentuk grafik dan chart.

Fitur:
• Pie chart — sebaran status KKA (Draft, Berjalan, Direview, Selesai)
• Bar chart — jumlah KKA per OPD
• Bar chart — total temuan per OPD
• Bar chart — jumlah KKA per tahun anggaran
• Ringkasan angka total: KKA, Temuan, Nilai Temuan`
  },
  {
    id: 'profil',
    icon: <User className="w-4 h-4" />,
    title: 'Profil',
    content: `Halaman profil pengguna yang sedang login.

Fitur:
• Informasi akun (nama, email, role, NIP, golongan, pangkat)
• Ringkasan aktivitas audit pribadi
• Daftar KKA yang sedang dikerjakan`
  },
  {
    id: 'pengaturan',
    icon: <Settings className="w-4 h-4" />,
    title: 'Menu Pengaturan',
    subsections: [
      {
        id: 'pengguna',
        icon: <User className="w-4 h-4" />,
        title: 'Pengguna',
        content: `Manajemen pengguna aplikasi (Admin/Irban/Inspektur saja).

Fitur:
• Daftar semua pengguna
• Tambah pengguna baru
• Edit data pengguna (nama, role, NIP, golongan, pangkat, bidang)
• Atur role: Auditor, Inspektur Pembantu, Inspektur, Admin`
      },
      {
        id: 'role-permission',
        icon: <ShieldAlert className="w-4 h-4" />,
        title: 'Role & Permission',
        content: `Atur izin akses per role.

Fitur:
• Daftar semua role yang tersedia
• Buat role baru dengan permission spesifik
• Atur permission per role (user.manage, role.manage, dll)
• Cocok untuk kontrol akses granular`
      },
      {
        id: 'log-aktivitas',
        icon: <Clock className="w-4 h-4" />,
        title: 'Log Aktivitas',
        content: `Riwayat aktivitas pengguna dalam sistem.

Fitur:
• Filter berdasarkan tipe aktivitas
• Filter berdasarkan rentang tanggal
• Pagination untuk navigasi log
• Lihat detail setiap aktivitas`
      }
    ]
  },
  {
    id: 'jenis-audit',
    icon: <FileCheck className="w-4 h-4" />,
    title: 'Jenis Audit (Template)',
    content: `Pengaturan template / jenis audit yang digunakan saat inisiasi KKA.

Fitur:
• Lihat semua template yang tersedia
• Buat template baru dengan kategori dan item checklist
• Edit template yang sudah ada
• Hapus template yang tidak digunakan
• Reset ke template standar

Template default: Audit Keuangan, Kinerja, Kepatuhan, Tujuan Tertentu, Investigasi, Operasional, Pemanfaatan Aset.`
  },
  {
    id: 'kka-workspace',
    icon: <PlusCircle className="w-4 h-4" />,
    title: 'Workspace KKA',
    content: `Halaman kerja utama untuk mengisi Kertas Kerja Audit.

Fitur:
• Kategori audit — tab untuk setiap jenis audit (Keuangan, Kinerja, dll)
• Item checklist — daftar item yang harus dievaluasi
• Status item: Sesuai (🟢), Temuan (🔴), N/A (⚪)
• Input nilai temuan (rupiah) untuk item bert status Temuan
• Uraian temuan dan rekomendasi
• Upload dokumen bukti pendukung
• Timeline / jadwal audit (4 milestone: Perencanaan → Pelaksanaan → LHP → Tindak Lanjut)
• Tombol aksi: Simpan, Selesai, Upload Berkas`
  }
];

type Section = typeof sections[0];

function SectionCard({ section, depth = 0, ...rest }: { section: Section; depth?: number; [key: string]: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubs = 'subsections' in section;

  return (
    <div className={`${depth === 0 ? 'bg-white rounded-2xl border border-pastel-blue/20 shadow-sm overflow-hidden' : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 text-left transition ${
          depth === 0
            ? 'px-5 py-4 hover:bg-pastel-blue/5'
            : 'px-4 py-2.5 hover:bg-pastel-blue/5 rounded-lg'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`${depth === 0 ? 'text-pastel-peach' : 'text-[var(--text-muted)]'} shrink-0`}>
            {section.icon}
          </span>
          <span className={`${depth === 0 ? 'font-black text-sm' : 'font-bold text-xs'} text-[var(--ink-soft)]`}>
            {section.title}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={depth === 0 ? 'px-5 pb-4 space-y-3' : 'px-4 pb-3 space-y-2'}>
          {'content' in section && section.content && (
            <pre className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans">
              {section.content}
            </pre>
          )}
          {'subsections' in section && section.subsections && (
            <div className="space-y-1">
              {section.subsections.map((sub: any) => (
                <SectionCard key={sub.id} section={sub} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GuideView() {
  return (
    <div className="space-y-4 animate-fade-in" id="guide-view">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-pastel-peach rounded-full" />
        <h2 className="text-lg font-black text-[var(--ink-soft)] tracking-tight">Panduan Aplikasi</h2>
      </div>

      <p className="text-xs text-[var(--text-secondary)] font-medium max-w-2xl">
        Panduan lengkap fitur dan cara penggunaan SI-PESAT. Klik setiap bagian untuk membuka detail.
      </p>

      <div className="space-y-3">
        {sections.map(section => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
