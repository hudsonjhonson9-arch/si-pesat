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
    { nama: 'Yuliana Tineke Evi Malo, ST', wilayah: 'Inspektur Pembantu Wilayah I', pangkat: 'Pembina Tingkat I – IV/b', nip: 'NIP. 19771109 200312 2 011' },
    { nama: 'Betseba L. Mude, S.Sos', wilayah: 'Inspektur Pembantu Wilayah II', pangkat: 'Pembina Tingkat I – IV/b', nip: 'NIP. 19740712 200112 2' },
    { nama: 'drh. Maimun I. Hamzah, S.KH', wilayah: 'Inspektur Pembantu Wilayah III', pangkat: 'Pembina – IV/a', nip: 'NIP. 19811004 200904 2 011' },
    { nama: 'Abdullah Daud, SE', wilayah: 'Inspektur Pembantu Wilayah IV', pangkat: 'Pembina – IV/a', nip: 'NIP. 19800606 200501 1 009' },
    { nama: 'Yunias Baga W. Male, SP., CFrA', wilayah: 'Inspektur Pembantu Wilayah V', pangkat: 'Pembina – IV/a', nip: 'NIP. 19760606 201001 1 002' },
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
          <span className="bg-pastel-peach/40 border border-pastel-peach/30 text-xs px-4 py-1.5 rounded-full font-bold inline-flex items-center gap-1.5 uppercase tracking-wider mb-4">
            <Building className="w-4 h-4 text-pastel-peach" /> Inspektorat Kabupaten Sumba Barat
          </span>
          <h1 className="text-xl md:text-3xl font-black tracking-tight text-[var(--ink-soft)] mb-3">
            SI-PESAT Inspektorat Kabupaten Sumba Barat
          </h1>
          <p className="text-[var(--text-secondary)] text-sm md:text-base max-w-2xl leading-relaxed">
            Sistem Informasi Penatausahaan Kertas Kerja Audit Terintegrasi Inspektur Pembantu Wilayah IV
          </p>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--ink-soft)] transition-colors"
          >
            <BookOpen className="w-4 h-4 text-pastel-peach" />
            {showGuide ? 'Tutup Panduan' : 'Buka Panduan Aplikasi'}
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Visi & Misi — manifesto panel (signature element) */}
      <div className="rounded-3xl p-6 md:p-10 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FEF9F0 0%, #F0F8F8 50%, #F8F4F0 100%)" }}>
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-pastel-peach/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-40 h-40 bg-pastel-blue/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_1px_1fr] gap-6 lg:gap-10">
          {/* Visi */}
          <div>
            <span className="text-pastel-peach text-xs md:text-[11px] font-bold uppercase tracking-[0.2em] mb-4 inline-block">
              Visi Pemerintah Daerah Kabupaten Sumba Barat
            </span>
            <Quote className="w-7 h-7 text-pastel-pink/50 mb-2" />
            <p
              className="text-[var(--ink-soft)] text-lg md:text-[26px] leading-snug"
              style={{ fontFamily: 'var(--font-serif-display)' }}
            >
              Terwujudnya Kehidupan Rakyat Sumba Barat yang Maju, Berdaya Saing dan Berkeadilan.
            </p>
          </div>

          <div className="hidden lg:block bg-pastel-blue/20" />
          <div className="lg:hidden h-px bg-pastel-blue/20" />

          {/* Misi */}
          <div>
            <span className="text-[var(--text-secondary)] text-xs md:text-[11px] font-bold uppercase tracking-[0.2em] mb-4 inline-block">
              Misi
            </span>
            <ol className="space-y-4">
              {misi.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-pastel-peach/30 border border-pastel-peach/40 text-[var(--ink-soft)] text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-[var(--text-secondary)] text-sm leading-relaxed">{item}</span>
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
            <h2 className="font-black text-[var(--ink-soft)] text-base md:text-lg tracking-tight">
              Tugas dan Fungsi Unit Kerja
            </h2>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-0.5">
              Berdasarkan Peraturan Bupati Sumba Barat Nomor 30 Tahun 2021, Tugas Pokok dan Fungsi
              Inspektorat Kabupaten Sumba Barat yaitu:
            </p>
          </div>
        </div>

        {/* Tugas */}
        <div className="pl-12 mb-6">
          <span className="text-[var(--text-secondary)] text-xs md:text-[11px] font-bold uppercase tracking-[0.15em]">
            1. Tugas Inspektorat Kabupaten Sumba Barat
          </span>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed mt-2 border-l-2 border-pastel-pink/40 pl-4">
            Membantu Bupati membina dan mengawasi pelaksanaan urusan pemerintahan yang menjadi
            kewenangan daerah dan tugas pembantuan yang diberikan kepada Pemerintah Daerah.
          </p>
        </div>

        {/* Fungsi */}
        <div className="pl-12">
          <span className="text-[var(--text-secondary)] text-xs md:text-[11px] font-bold uppercase tracking-[0.15em]">
            2. Fungsi Inspektorat Kabupaten Sumba Barat
          </span>
          <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-4">
            {fungsi.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 text-pastel-peach font-black text-xs md:text-sm tabular-nums">
                  {String.fromCharCode(97 + i)})
                </span>
                <span className="text-sm text-[var(--text-primary)] leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Struktur Organisasi — Bagan Hierarki */}
      <div className="rounded-3xl p-6 md:p-8" style={{ background: "linear-gradient(135deg, #FFE8D6 0%, #D6E8FF 100%)" }}>
        <div className="flex items-center gap-2.5 mb-6">
          <span className="text-pastel-peach"><Users2 className="w-5 h-5" /></span>
          <h3 className="font-black text-[var(--ink-soft)] text-sm">Struktur Organisasi</h3>
        </div>

        {/* Kanvas bagan: garis dibuat presisi via SVG (koordinat 0 0 1200 800),
           kotak jabatan diposisikan absolute dengan persentase yang sama agar selalu align dengan garis */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
          <div className="relative w-[900px] md:w-full" style={{ aspectRatio: '1200 / 800' }}>
          {/* Garis penghubung */}
          <svg
            viewBox="0 0 1200 800"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            <g stroke="#B8AFA4" strokeWidth="2.5" fill="none">
              <line x1="600" y1="112" x2="600" y2="160" />
              <line x1="600" y1="160" x2="600" y2="540" />
              <line x1="600" y1="160" x2="945" y2="160" />
              <line x1="945" y1="160" x2="945" y2="192" />
              <line x1="945" y1="282" x2="945" y2="320" />
              <line x1="790" y1="320" x2="1055" y2="320" />
              <line x1="790" y1="320" x2="790" y2="352" />
              <line x1="1055" y1="320" x2="1055" y2="352" />
              <line x1="600" y1="540" x2="600" y2="732" />
              <line x1="150" y1="540" x2="1050" y2="540" />
              <line x1="150" y1="540" x2="150" y2="562" />
              <line x1="375" y1="540" x2="375" y2="562" />
              <line x1="600" y1="540" x2="600" y2="562" />
              <line x1="825" y1="540" x2="825" y2="562" />
              <line x1="1050" y1="540" x2="1050" y2="562" />
            </g>
          </svg>

          {/* INSPEKTUR */}
          <div className="absolute" style={{ left: '40.83%', top: '2.5%', width: '18.33%', height: '11.25%' }}>
<div className="bg-pastel-cream/50 border border-dark-gray/15 rounded-xl px-3 py-2 shadow-xs text-center h-full flex flex-col justify-center">
              <p className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-pastel-peach/70 mb-0.5">INSPEKTUR</p>
              <p className="text-[12px] md:text-base font-black text-dark-gray underline underline-offset-2 decoration-dark-gray/20 leading-tight break-words">{orgData.inspektur.nama}</p>
              <p className="text-[8px] md:text-sm text-dark-gray/60 mt-0.5 leading-snug">{orgData.inspektur.pangkat}</p>
              <p className="text-[7px] md:text-xs text-dark-gray/40 font-mono">{orgData.inspektur.nip}</p>
            </div>
          </div>

          {/* SEKRETARIS */}
          <div className="absolute" style={{ left: '69.17%', top: '24%', width: '19.17%', height: '11.25%' }}>
<div className="bg-pastel-blue/20 rounded-xl px-3 py-2 border border-dark-gray/15 shadow-xs text-center h-full flex flex-col justify-center">
              <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-dark-gray/50 mb-0.5">SEKRETARIS</p>
              <p className="text-[12px] md:text-base font-black text-dark underline underline-offset-2 decoration-dark-gray/20 leading-tight break-words">{orgData.sekretaris.nama}</p>
              <p className="text-[8px] md:text-sm text-dark-gray/60 mt-0.5 font-medium leading-snug">{orgData.sekretaris.pangkat}</p>
              <p className="text-[7px] md:text-xs text-dark-gray/40 font-mono">{orgData.sekretaris.nip}</p>
            </div>
          </div>

          {/* ANALIS PERENCANA */}
          <div className="absolute" style={{ left: '56.67%', top: '44%', width: '18.33%', height: '12.5%' }}>
<div className="bg-pastel-lavender/20 rounded-xl px-3 py-2 border border-dark-gray/12 shadow-xs text-center h-full flex flex-col justify-center">
              <p className="text-[9px] md:text-sm font-bold uppercase tracking-wider text-dark-gray/50 mb-0.5">ANALIS PERENCANA</p>
              <p className="text-[11px] md:text-base font-bold text-dark underline underline-offset-2 decoration-dark-gray/20 leading-tight break-words">{orgData.analis.nama}</p>
              <p className="text-[8px] md:text-sm text-dark-gray/60 mt-0.5 font-medium leading-snug">{orgData.analis.pangkat}</p>
              <p className="text-[7px] md:text-xs text-dark-gray/40 font-mono leading-tight">{orgData.analis.nip}</p>
            </div>
          </div>

          {/* KASUBAG TATA USAHA */}
          <div className="absolute" style={{ left: '78.33%', top: '44%', width: '19.17%', height: '12.5%' }}>
<div className="bg-pastel-green/20 rounded-xl px-3 py-2 border border-dark-gray/12 shadow-xs text-center h-full flex flex-col justify-center">
              <p className="text-[9px] md:text-sm font-bold uppercase tracking-wider text-dark-gray/50 mb-0.5">KASUBAG TATA USAHA</p>
              <p className="text-[11px] md:text-base font-bold text-dark underline underline-offset-2 decoration-dark-gray/20 leading-tight break-words">{orgData.kasubag.nama}</p>
              <p className="text-[8px] md:text-sm text-dark-gray/60 mt-0.5 font-medium leading-snug">{orgData.kasubag.pangkat}</p>
              <p className="text-[7px] md:text-xs text-dark-gray/40 font-mono leading-tight">{orgData.kasubag.nip}</p>
            </div>
          </div>

          {/* 5 IRBAN WILAYAH */}
          {orgData.irbans.map((irban, i) => {
            const lefts = ['4.58%', '23.33%', '42.08%', '60.83%', '79.58%'];
            return (
              <div key={i} className="absolute" style={{ left: lefts[i], top: '70.25%', width: '15.83%', height: '15%' }}>
<div className="rounded-xl px-2.5 py-1.5 border border-dark-gray/12 shadow-xs text-center h-full flex flex-col justify-center" style={{ backgroundColor: ['#FFF0F0', '#FFF5E0', '#F0FFF0', '#F0F5FF', '#F5F0FF'][i] }}>
                  <p className="text-[8px] md:text-sm font-bold uppercase tracking-wider text-dark-gray/50 mb-0.5 leading-tight break-words">{irban.wilayah}</p>
                  <p className="text-[9px] md:text-sm font-bold text-dark underline underline-offset-2 decoration-dark-gray/20 leading-tight break-words">{irban.nama}</p>
                  <p className="text-[7px] md:text-xs text-dark-gray/60 mt-0.5 font-medium leading-snug">{irban.pangkat}</p>
                  <p className="text-[6px] md:text-[11px] text-dark-gray/40 font-mono leading-tight">{irban.nip}</p>
                </div>
              </div>
            );
          })}

          {/* KELOMPOK JABATAN FUNGSIONAL */}
          <div className="absolute" style={{ left: '40.42%', top: '91.5%', width: '19.17%', height: '8.75%' }}>
<div className="bg-pastel-pink/20 rounded-xl px-4 py-1.5 border-2 border-dashed border-dark-gray/20 shadow-xs text-center h-full flex items-center justify-center">
              <p className="text-[9px] md:text-sm font-bold uppercase tracking-widest text-dark-gray/50 leading-tight">KELOMPOK JABATAN FUNGSIONAL</p>
            </div>
          </div>
        </div>
        </div>
      </div>

      {showGuide && <div ref={guideRef}><GuideView /></div>}
    </div>
  );
}