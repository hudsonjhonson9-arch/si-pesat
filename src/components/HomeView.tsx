import React, { useState, useEffect, useRef } from 'react';
import { Building, Users2, BookOpen, ChevronDown, ScrollText, Quote, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GuideView from './GuideView';

const misi = [
  'Mengembangkan usaha ekonomi produktif yang berbasis pertanian dengan pariwisata sebagai penggerak utama',
  'Mewujudkan sumber daya manusia yang unggul, berkarakter, sehat jasmani rohani, produktif, berkualitas dan profesional melalui peningkatan akses dan kualitas pelayanan kesehatan dan pendidikan',
  'Meningkatkan pembangunan infrastruktur dan penataan ruang kawasan berwawasan lingkungan untuk menjamin aksesibilitas pemerataan pembangunan',
  'Meningkatkan ketentraman dan ketertiban umum',
  'Meningkatkan kapasitas aparatur dan tata kelola pemerintahan yang transparan, akuntabel, profesional dan berjiwa melayani',
];

const fungsi = [
  'Perumusan kebijakan teknis bidang pengawasan dan fasilitasi pengawasan',
  'Pelaksanaan pengawasan internal terhadap kinerja dan keuangan melalui audit, reviu, evaluasi, pemantauan, dan kegiatan pengawasan lainnya',
  'Pelaksanaan pengawasan untuk tujuan tertentu atas penugasan dari bupati dan/atau gubernur sebagai wakil Pemerintah Pusat',
  'Penyusunan laporan hasil pengawasan',
  'Pelaksanaan koordinasi pencegahan tindak pidana korupsi',
  'Pengawasan pelaksanaan program reformasi birokrasi',
  'Pelaksanaan administrasi inspektorat daerah kabupaten',
  'Pelaksanaan fungsi lain yang diberikan oleh Bupati terkait dengan tugas dan fungsinya',
];

const orgData = {
  inspektur: { nama: 'Weru Raddi Kaka Ora, SP', pangkat: 'Pembina Tingkat I – IV/b', nip: 'NIP. 19791118 200312 2 012' },
  sekretaris: { nama: 'Simon Malo Kii, S.Pd., M.Si', pangkat: 'Pembina Tingkat I – IV/b', nip: 'NIP. 19691022 200501 1 005' },
  analis: { nama: 'Margaretha Maghu', pangkat: 'Penata Tingkat I – III/d', nip: 'NIP. 19690527 199203 2 009' },
  kasubag: { nama: 'Marden Ratte, SE', pangkat: 'Penata Tingkat I – III/d', nip: 'NIP. 19770323 201001 2 018' },
  irbans: [
    { nama: 'Yuliana Tineke Evi Malo, ST', wilayah: 'Wilayah I', pangkat: 'Pembina Tingkat I – IV/b', nip: 'NIP. 19771109 200312 2 011' },
    { nama: 'Betseba L. Mude, S.Sos', wilayah: 'Wilayah II', pangkat: 'Pembina Tingkat I – IV/b', nip: 'NIP. 19740712 200112 2' },
    { nama: 'drh. Maimun I. Hamzah, S.KH', wilayah: 'Wilayah III', pangkat: 'Pembina – IV/a', nip: 'NIP. 19811004 200904 2 011' },
    { nama: 'Abdullah Daud, SE', wilayah: 'Wilayah IV', pangkat: 'Pembina – IV/a', nip: 'NIP. 19800606 200501 1 009' },
    { nama: 'Yunias Baga W. Male, SP., CFrA', wilayah: 'Wilayah V', pangkat: 'Pembina – IV/a', nip: 'NIP. 19760606 201001 1 002' },
  ],
};

export default function HomeView() {
  const [showGuide, setShowGuide] = useState(false);
  const [inspekturName, setInspekturName] = useState('');
  const guideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('profiles').select('full_name').eq('role', 'Inspektur').single().then(({ data }) => {
      if (data?.full_name) setInspekturName(data.full_name);
    });
  }, []);

  useEffect(() => {
    if (showGuide && guideRef.current) {
      guideRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showGuide]);

  return (
    <div className="space-y-5 animate-fade-in" id="home-view">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 md:p-8 text-[var(--text-primary)] shadow-lg relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #FEFDF8 0%, #E8F0F8 50%, #F8F8F0 100%)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-pastel-cream/80 via-pastel-blue/20 to-pastel-peach/10" />
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-48 h-48 bg-pastel-pink/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 -mb-10 w-40 h-40 bg-pastel-lavender/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="bg-pastel-peach/40 border border-pastel-peach/30 text-[10px] px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 uppercase tracking-wider mb-3">
            <Building className="w-3.5 h-3.5 text-pastel-peach" /> Inspektorat Kabupaten Sumba Barat
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--ink-soft)] mb-2">
            SI-PESAT Inspektorat Kabupaten Sumba Barat
          </h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-2xl leading-relaxed">
            Sistem Informasi Penatausahaan Kertas Kerja Audit Terintegrasi Inspektur Pembantu Wilayah IV
          </p>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--ink-soft)] transition-colors"
          >
            <BookOpen className="w-4 h-4 text-pastel-peach" />
            {showGuide ? 'Tutup Panduan' : 'Buka Panduan Aplikasi'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Visi & Misi — manifesto panel (signature element) */}
      <div className="rounded-3xl p-6 md:p-10 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FEF9F0 0%, #F0F8F8 50%, #F8F4F0 100%)" }}>
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-pastel-peach/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-40 h-40 bg-pastel-blue/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_1px_1fr] gap-8 lg:gap-10">
          {/* Visi */}
          <div>
            <span className="text-pastel-peach text-[10px] font-bold uppercase tracking-[0.2em] mb-4 inline-block">
              Visi Pemerintah Daerah Kabupaten Sumba Barat
            </span>
            <Quote className="w-6 h-6 text-pastel-pink/50 mb-2" />
            <p
              className="text-[var(--ink-soft)] text-xl md:text-[26px] leading-snug"
              style={{ fontFamily: 'var(--font-serif-display)' }}
            >
              Terwujudnya Kehidupan Rakyat Sumba Barat yang Maju, Berdaya Saing dan Berkeadilan.
            </p>
          </div>

          <div className="hidden lg:block bg-pastel-blue/20" />
          <div className="lg:hidden h-px bg-pastel-blue/20" />

          {/* Misi */}
          <div>
            <span className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[0.2em] mb-4 inline-block">
              Misi
            </span>
            <ol className="space-y-3.5">
              {misi.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-pastel-peach/30 border border-pastel-peach/40 text-[var(--ink-soft)] text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-[var(--text-secondary)] text-[12.5px] leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Tugas & Fungsi — formal legal section */}
      <div className="rounded-3xl p-6 md:p-8" style={{ background: "linear-gradient(135deg, #FEF9F0 0%, #F0F8F8 100%)" }}>
        <div className="flex items-start gap-3 mb-5">
          <span className="shrink-0 w-9 h-9 rounded-xl bg-pastel-green/30 text-[var(--ink-soft)] flex items-center justify-center">
            <ScrollText className="w-4.5 h-4.5" />
          </span>
          <div>
            <h2 className="font-black text-[var(--ink-soft)] text-sm md:text-base tracking-tight">
              Tugas dan Fungsi Unit Kerja
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Berdasarkan Peraturan Bupati Sumba Barat Nomor 30 Tahun 2021, Tugas Pokok dan Fungsi
              Inspektorat Kabupaten Sumba Barat yaitu:
            </p>
          </div>
        </div>

        {/* Tugas */}
        <div className="pl-12 mb-6">
          <span className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[0.15em]">
            1. Tugas Inspektorat Kabupaten Sumba Barat
          </span>
          <p className="text-[12.5px] text-[var(--text-primary)] leading-relaxed mt-2 border-l-2 border-pastel-pink/40 pl-4">
            Membantu Bupati membina dan mengawasi pelaksanaan urusan pemerintahan yang menjadi
            kewenangan daerah dan tugas pembantuan yang diberikan kepada Pemerintah Daerah.
          </p>
        </div>

        {/* Fungsi */}
        <div className="pl-12">
          <span className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[0.15em]">
            2. Fungsi Inspektorat Kabupaten Sumba Barat
          </span>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-3">
            {fungsi.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 text-pastel-peach font-black text-[11px] tabular-nums">
                  {String.fromCharCode(97 + i)})
                </span>
                <span className="text-[12px] text-[var(--text-primary)] leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Struktur Organisasi — Bagan Hierarki */}
      <div className="rounded-3xl p-6 md:p-8" style={{ background: "linear-gradient(135deg, #F8F4F0 0%, #F0F4F8 100%)" }}>
        <div className="flex items-center gap-2.5 mb-6">
          <span className="text-pastel-peach"><Users2 className="w-5 h-5" /></span>
          <h3 className="font-black text-[var(--ink-soft)] text-sm">Struktur Organisasi</h3>
        </div>

        <div className="flex flex-col items-center">
          {/* Puncak: Inspektur */}
          <div className="text-center max-w-[260px] w-full">
            <div className="bg-white border border-dark-gray/15 rounded-xl px-4 py-3 shadow-xs">
              <p className="text-[9px] font-bold uppercase tracking-wider text-pastel-peach/70 mb-1">INSPEKTUR</p>
              <p className="text-xs font-black text-dark-gray underline underline-offset-4 decoration-dark-gray/20">{orgData.inspektur.nama}</p>
              <p className="text-[9px] text-dark-gray/60 mt-1.5 leading-snug">{orgData.inspektur.pangkat}</p>
              <p className="text-[8px] text-dark-gray/40 font-mono">{orgData.inspektur.nip}</p>
            </div>
            <div className="w-px h-6 bg-dark-gray/20 mx-auto" />
          </div>

          {/* Tingkat 2: Sekretaris + turunannya */}
          <div className="flex flex-col items-center w-full max-w-4xl">
            <div className="w-full flex justify-center">
              <div className="max-w-[260px] w-full">
                <div className="bg-white rounded-xl px-4 py-3 border border-dark-gray/15 shadow-xs text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-dark-gray/50 mb-1">SEKRETARIS</p>
                  <p className="text-xs font-black text-dark underline underline-offset-4 decoration-dark-gray/20">{orgData.sekretaris.nama}</p>
                  <p className="text-[9px] text-dark-gray/60 mt-1.5 font-medium leading-snug">{orgData.sekretaris.pangkat}</p>
                  <p className="text-[8px] text-dark-gray/40 font-mono">{orgData.sekretaris.nip}</p>
                </div>
              </div>
            </div>
            <div className="w-0.5 h-8 bg-dark-gray/20" />
            {/* Garis horizontal di bawah Sekretaris */}
            <div className="w-full h-px bg-dark-gray/20 mb-0" />
            <div className="w-full flex justify-center gap-3 relative">
              <div className="w-0.5 h-6 bg-dark-gray/20 absolute top-0" />
            </div>
            <div className="flex gap-6 w-full justify-center">
              <div className="flex-1 max-w-[220px]">
                <div className="bg-white rounded-xl px-3 py-2.5 border border-dark-gray/12 shadow-xs text-center">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-dark-gray/50 mb-1">ANALIS PERENCANA</p>
                  <p className="text-[11px] font-bold text-dark underline underline-offset-4 decoration-dark-gray/20">{orgData.analis.nama}</p>
                  <p className="text-[8px] text-dark-gray/60 mt-1 font-medium">{orgData.analis.pangkat}</p>
                  <p className="text-[7px] text-dark-gray/40 font-mono">{orgData.analis.nip}</p>
                </div>
              </div>
              <div className="flex-1 max-w-[220px]">
                <div className="bg-white rounded-xl px-4 py-2.5 border border-dark-gray/12 shadow-xs text-center">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-dark-gray/50 mb-1">KASUBAG TATA USAHA</p>
                  <p className="text-[11px] font-bold text-dark underline underline-offset-4 decoration-dark-gray/20">{orgData.kasubag.nama}</p>
                  <p className="text-[8px] text-dark-gray/60 mt-1 font-medium">{orgData.kasubag.pangkat}</p>
                  <p className="text-[7px] text-dark-gray/40 font-mono">{orgData.kasubag.nip}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Garis turun dari Sekretaris ke Irban */}
          <div className="w-0.5 h-10 bg-dark-gray/20" />

          {/* Tingkat 3: Inspektur Pembantu Wilayah — garis horizontal */}
          <div className="w-full max-w-5xl">
            {/* Garis horizontal */}
            <div className="relative flex items-center justify-center mb-10">
              <div className="absolute left-0 right-0 h-px bg-dark-gray/20" />
              {/* Ini node pusat sebagai turunan Inspektur langsung */}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 relative">
              {orgData.irbans.map((irban, i) => (
                <div key={i} className="relative">
                  {/* Garis vertikal ke masing-masing kotak */}
                  <div className="flex justify-center mb-2">
                    <div className="w-0.5 h-6 bg-dark-gray/20" />
                  </div>
                  <div className="bg-white rounded-xl px-3 py-2.5 border border-dark-gray/12 shadow-xs text-center h-full flex flex-col justify-center">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-dark-gray/50 mb-1">{irban.wilayah}</p>
                    <p className="text-[10px] font-bold text-dark underline underline-offset-4 decoration-dark-gray/20 leading-tight">{irban.nama}</p>
                    <p className="text-[7px] text-dark-gray/60 mt-1 font-medium leading-snug">{irban.pangkat}</p>
                    <p className="text-[6px] text-dark-gray/40 font-mono leading-tight">{irban.nip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tingkat 4: Fungsional */}
          <div className="flex justify-center mt-2">
            <div className="w-0.5 h-8 bg-dark-gray/20" />
          </div>
          <div className="max-w-[260px] w-full">
            <div className="bg-white rounded-xl px-5 py-3 border-2 border-dashed border-dark-gray/20 shadow-xs text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-dark-gray/50">KELOMPOK JABATAN FUNGSIONAL</p>
            </div>
          </div>
        </div>
      </div>

      {showGuide && <div ref={guideRef}><GuideView /></div>}
    </div>
  );
}
