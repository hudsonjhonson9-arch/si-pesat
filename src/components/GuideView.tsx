import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, FileCheck, Building, BarChart3, User, Settings, PieChart, FolderSync, TrendingDown, Cloud, School, PlusCircle, ShieldAlert, Clock, MapPin, X } from 'lucide-react';

type NavRoute = string | { tab: string; sub?: string };

const routeMap: Record<string, NavRoute> = {
  beranda: 'dashboard',
  'wilayah-penugasan': 'wilayah-penugasan',
  kka: { tab: 'pengawasan', sub: 'audit' },
  reviu: { tab: 'pengawasan', sub: 'reviu' },
  evaluasi: { tab: 'pengawasan', sub: 'evaluasi' },
  asistensi: { tab: 'pengawasan', sub: 'asistensi' },
  statistik: 'statistik',
  profil: 'profil',
  pengguna: 'pengguna',
  'role-permission': 'role-permission',
  'log-aktivitas': 'activity-log',
  'jenis-audit': 'jenis-audit',
  'kka-workspace': 'new-audit',
};

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
• Daftar KKA — kartu grup per OPD dengan stat (Jenis, Selesai, Berjalan, Temuan)
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
• Pie chart — sebaran status KKA (Berjalan, Direview, Selesai)
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

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase()
      ? `<mark class="bg-yellow-200 text-dark-gray rounded-sm px-0.5">${p}</mark>`
      : p
  ).join('');
}

function SectionCard({ section, depth = 0, searchQuery, onNavigate }: { section: Section; depth?: number; searchQuery?: string; onNavigate?: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubs = 'subsections' in section;
  const route = !hasSubs ? routeMap[section.id] : undefined;
  const matchesSearch = searchQuery
    ? section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ('content' in section && section.content?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (hasSubs && section.subsections?.some((sub: any) =>
        sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.content?.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    : true;

  if (searchQuery && !matchesSearch && !isOpen) return null;
  if (searchQuery && matchesSearch && !isOpen) setIsOpen(true);

  return (
    <div className={`transition-all duration-300 ${depth === 0 ? 'bg-white rounded-2xl border border-pastel-blue/20 shadow-sm overflow-hidden' : ''} ${matchesSearch && searchQuery ? 'ring-2 ring-yellow-300/50' : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 text-left transition-all duration-200 ${
          depth === 0
            ? 'px-5 py-4 hover:bg-pastel-blue/5'
            : 'px-4 py-2.5 hover:bg-pastel-blue/5 rounded-lg'
        } ${isOpen ? 'bg-pastel-blue/5' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`${depth === 0 ? 'text-pastel-peach' : 'text-[var(--text-muted)]'} shrink-0`}>
            {section.icon}
          </span>
          <span className={`${depth === 0 ? 'font-black text-sm' : 'font-bold text-xs'} text-[var(--ink-soft)]`}>
            {section.title}
          </span>
          {matchesSearch && searchQuery && (
            <span className="text-[9px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded-full">cocok</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className={depth === 0 ? 'px-5 pb-4 space-y-3' : 'px-4 pb-3 space-y-2'}>
          {'content' in section && section.content && (
            <div
              className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans"
              dangerouslySetInnerHTML={{ __html: searchQuery ? highlightMatch(section.content, searchQuery) : section.content }}
            />
          )}
          {'subsections' in section && section.subsections && (
            <div className="space-y-1">
              {section.subsections.map((sub: any) => (
                <SectionCard key={sub.id} section={sub} depth={depth + 1} searchQuery={searchQuery} onNavigate={onNavigate} />
              ))}
            </div>
          )}
          {route && onNavigate && (
            <button
              onClick={() => onNavigate(section.id)}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-pastel-peach hover:text-pastel-peach/80 transition-colors"
            >
              Buka fitur ini <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuideView({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const [search, setSearch] = useState('');

  const handleNav = (id: string) => {
    const route = routeMap[id];
    if (!route) return;
    if (typeof route === 'string') {
      window.location.hash = route;
    } else {
      window.location.hash = `${route.tab}/${route.sub || ''}`;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in" id="guide-view">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-pastel-peach rounded-full" />
        <h2 className="text-lg font-black text-[var(--ink-soft)] tracking-tight">Panduan Aplikasi</h2>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-gray/30" />
        <input
          type="text"
          placeholder="Cari fitur atau panduan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs font-medium border border-dark-gray/15 bg-white pl-9 pr-8 py-2 rounded-xl focus:outline-none focus:border-peach-accent focus:ring-1 focus:ring-peach-accent/20 transition"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-dark-gray/30 hover:text-dark-gray cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-xs text-[var(--text-secondary)] font-medium max-w-2xl">
        Panduan lengkap fitur dan cara penggunaan SI-PESAT. Klik setiap bagian untuk membuka detail.
      </p>

      <div className="space-y-3">
        {sections.map(section => (
          <SectionCard key={section.id} section={section} searchQuery={search} onNavigate={handleNav} />
        ))}
        {search && !sections.some(s =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.content?.toLowerCase().includes(search.toLowerCase()) ||
          s.subsections?.some((sub: any) =>
            sub.title.toLowerCase().includes(search.toLowerCase()) ||
            sub.content?.toLowerCase().includes(search.toLowerCase())
          )
        ) && (
          <div className="text-center py-8 text-xs text-dark-gray/40 font-medium">
            Tidak ditemukan hasil untuk "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
