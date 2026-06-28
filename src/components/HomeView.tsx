import React, { useState, useEffect } from 'react';
import { Building, Shield, Eye, Target, Users, MapPin, CheckCircle, BookOpen, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GuideView from './GuideView';

export default function HomeView() {
  const [showGuide, setShowGuide] = useState(false);
  const [inspekturName, setInspekturName] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('full_name').eq('role', 'Inspektur').single().then(({ data }) => {
      if (data?.full_name) setInspekturName(data.full_name);
    });
  }, []);

  const profileCards = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Tugas & Fungsi',
      items: [
        'Penyelenggaraan pengawasan internal terhadap kinerja dan keuangan',
        'Pengawasan penyelenggaraan urusan pemerintahan daerah',
        'Pembinaan penyelenggaraan Sistem Pengendalian Intern Pemerintah (SPIP)',
        'Pemeriksaan, pengusutan, dan penilaian tugas pengawasan',
      ]
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Visi',
      items: [
        'Terwujudnya Pengawasan Internal Yang Profesional, Berintegritas, dan Terpercaya Menuju Kabupaten Sumba Barat Yang Maju, Mandiri, dan Berdaya Saing',
      ]
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: 'Misi',
      items: [
        'Meningkatkan kualitas perencanaan dan pelaksanaan pengawasan',
        'Mengoptimalkan peran APIP dalam mendorong tata kelola pemerintahan yang baik',
        'Membangun budaya pengendalian dan kepatuhan di seluruh OPD',
        'Meningkatkan kompetensi dan profesionalisme auditor',
      ]
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Struktur Organisasi',
      items: [
        inspekturName ? `Inspektur — ${inspekturName}` : 'Inspektur — ...',
        'Sekretariat — Bagian Tata Usaha',
        'Inspektur Pembantu Wilayah I — Kecamatan Kota, Laboya Barat',
        'Inspektur Pembantu Wilayah II — Kecamatan Tana Righu',
        'Inspektur Pembantu Wilayah III — Kecamatan Lamboya, Wanokaka',
        'Inspektur Pembantu Wilayah IV — Kecamatan Loli',
      ]
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: 'Wilayah Kerja',
      items: [
        'Meliputi 6 Kecamatan, 11 Kelurahan, dan 63 Desa di Kabupaten Sumba Barat',
        'Pengawasan terhadap 35 OPD, 5 Puskesmas, 66 SD, 18 SMP',
        'Koordinasi dengan Inspektorat Provinsi NTT dan BPKP',
      ]
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Komitmen Mutu',
      items: [
        'Pengawasan berbasis risiko (Risk-Based Audit)',
        'Kepatuhan terhadap Kode Etik APIP',
        'Ketepatan waktu pelaporan dan tindak lanjut',
        'Perbaikan berkelanjutan sistem pengawasan',
      ]
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in" id="home-view">
      {/* Header Banner */}
      <div 
        className="rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden bg-slate-900 bg-center bg-cover"
        style={{ backgroundImage: "url('/header-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/70 to-slate-800/40" />
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 -mb-10 w-40 h-40 bg-peach-accent/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="bg-white/20 backdrop-blur-md border border-white/10 text-[10px] px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 uppercase tracking-wider mb-3">
            <Building className="w-3.5 h-3.5" /> Inspektorat Kabupaten Sumba Barat
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
            SI-PESAT Inspektorat Kabupaten Sumba Barat
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Sistem Informasi Penatausahaan Kertas Kerja Audit Terintegrasi Inspektur Pembantu Wilayah IV
          </p>
        </div>
      </div>

      {/* Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profileCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-5 border border-dark-gray/10 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-peach-accent">{card.icon}</span>
              <h3 className="font-black text-dark-gray text-sm">{card.title}</h3>
            </div>
            <ul className="space-y-2">
              {card.items.map((item, i) => (
                <li key={i} className="text-[11px] text-dark-gray/70 leading-relaxed flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-peach-accent mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Guide toggle */}
      <div className="border-t border-dark-gray/10 pt-6">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-2 text-xs font-bold text-dark-gray/60 hover:text-dark-gray transition-colors mx-auto"
        >
          <BookOpen className="w-4 h-4" />
          {showGuide ? 'Tutup Panduan' : 'Buka Panduan Aplikasi'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showGuide && <GuideView />}
    </div>
  );
}
