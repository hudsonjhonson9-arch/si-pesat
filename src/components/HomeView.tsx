import React from 'react';
import { TargetEntity } from '../types';
import { Map, MapPin, Building, Landmark, Activity, User, BookOpen } from 'lucide-react';

interface HomeViewProps {
  targetEntities: TargetEntity[];
}

export default function HomeView({ targetEntities }: HomeViewProps) {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'OPD': return <Building className="w-4 h-4" />;
      case 'Desa': return <Landmark className="w-4 h-4" />;
      case 'Sekolah': return <BookOpen className="w-4 h-4" />;
      case 'Puskesmas': return <Activity className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'OPD': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Desa': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Sekolah': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Puskesmas': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="home-view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 -mb-10 w-40 h-40 bg-peach-accent/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <span className="bg-white/20 backdrop-blur-md border border-white/10 text-[10px] px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 uppercase tracking-wider mb-3">
            <Building className="w-3.5 h-3.5" /> Inspektorat Daerah
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
            Inspektur Pembantu Wilayah IV
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Mempunyai tugas pokok melaksanakan pengawasan internal terhadap kinerja dan keuangan 
            pada OPD, Kecamatan, Desa, Sekolah, dan Puskesmas di wilayah kerja Irban 4.
          </p>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-dark-gray text-lg flex items-center gap-2">
              <Map className="w-5 h-5 text-peach-accent" />
              Peta Wilayah Pengawasan
            </h3>
            <p className="text-xs text-dark-gray/60 mt-0.5">
              Cakupan wilayah Kecamatan Loli, Kabupaten Sumba Barat
            </p>
          </div>
        </div>
        
        <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center p-4 relative min-h-[300px]">
          <img 
            src="/kecamatan_loli_map.png" 
            alt="Peta Kecamatan Loli" 
            className="w-full max-w-2xl object-contain drop-shadow-md z-10"
            onError={(e) => {
               (e.target as HTMLImageElement).src = 'https://placehold.co/800x400/f8fafc/64748b?text=Peta+Kecamatan+Loli+Tidak+Ditemukan';
            }}
          />
          {/* Decorative map dots */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </div>
      </div>

      {/* Target Entities Table */}
      <div className="bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-dark-gray text-base">Daftar Entitas Pengawasan (OPD)</h3>
            <p className="text-xs text-dark-gray/60 mt-0.5">
              Daftar instansi, sekolah, dan puskesmas yang berada di bawah pengawasan Irban IV.
            </p>
          </div>
          <span className="text-[10px] bg-peach-accent text-dark-gray border border-dark-gray/10 px-2.5 py-1 rounded font-bold font-mono uppercase">
            {targetEntities.length} Entitas
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 w-10 text-center">No</th>
                <th className="p-3.5">Nama Entitas</th>
                <th className="p-3.5">Kategori</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {targetEntities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Belum ada data entitas.
                  </td>
                </tr>
              ) : (
                targetEntities.map((entity, idx) => (
                  <tr key={entity.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {entity.name}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getBadgeColor(entity.type)}`}>
                        {getIconForType(entity.type)} {entity.type}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
