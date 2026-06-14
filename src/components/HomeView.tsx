import React, { useMemo } from 'react';
import { TargetEntity, OpdAudit } from '../types';
import { Map as MapIcon, MapPin, Building, Landmark, Activity, User, BookOpen, BarChart3, CheckCircle, FileText, AlertTriangle, ArrowUpRight, FolderOpen } from 'lucide-react';

interface HomeViewProps {
  targetEntities: TargetEntity[];
  audits?: OpdAudit[];
  onSelectAudit?: (audit: OpdAudit) => void;
}

export default function HomeView({ targetEntities, audits = [], onSelectAudit }: HomeViewProps) {
  // Simple analytics computation
  const stats = useMemo(() => {
    const totalAudits = audits.length;
    const completedAudits = audits.filter(a => a.status === 'Selesai').length;
    const inProgressAudits = totalAudits - completedAudits;
    let totalTemuan = 0;

    audits.forEach(audit => {
      audit.categories.forEach(cat => {
        cat.items.forEach(item => {
          if (item.status === 'Temuan') totalTemuan++;
        });
      });
    });

    return { totalAudits, completedAudits, inProgressAudits, totalTemuan };
  }, [audits]);

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-dark-gray text-lg flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-peach-accent" />
                Peta Wilayah Pengawasan
              </h3>
              <p className="text-xs text-dark-gray/60 mt-0.5">
                Cakupan wilayah Kecamatan Loli, Kabupaten Sumba Barat
              </p>
            </div>
          </div>

          <div className="w-full bg-slate-50 border border-slate-100 overflow-hidden flex-1 relative min-h-[400px] z-10 rounded-sm">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126130.65487777717!2d119.34005886470355!3d-9.610667794353723!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2c4cac4b998cfb27%3A0x6b30f73f278d65de!2sLoli%2C%20Kabupaten%20Sumba%20Barat%2C%20Nusa%20Tenggara%20Tim.!5e0!3m2!1sid!2sid!4v1714545000000!5m2!1sid!2sid"
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        {/* Audit Objects Table */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-dark-gray text-base">Daftar Objek Audit</h3>
              <p className="text-xs text-dark-gray/60 mt-0.5">
                Pemantauan KKA Irban IV.
              </p>
            </div>
            <span className="text-[10px] bg-peach-accent text-dark-gray border border-dark-gray/10 px-2.5 py-1 rounded font-bold font-mono uppercase">
              {audits.length} Objek
            </span>
          </div>

          <div className="overflow-y-auto flex-1 border border-slate-150 rounded-xl bg-white max-h-[450px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-xs">
                <tr className="border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Nama Objek</th>
                  <th className="p-3.5 w-24">Status</th>
                  <th className="p-3.5 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audits.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Belum ada KKA.
                    </td>
                  </tr>
                ) : (
                  audits.map((audit) => (
                    <tr
                      key={audit.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => onSelectAudit && onSelectAudit(audit)}
                    >
                      <td className="p-3.5 font-bold text-slate-800">
                        {audit.opdName}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${audit.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            audit.status === 'Direview' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              audit.status === 'Sedang Berjalan' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                          {audit.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="px-3 py-1.5 bg-peach-accent text-dark-gray text-[10px] font-bold rounded-md hover:opacity-90 transition inline-flex items-center gap-1 ml-auto">
                          <FolderOpen className="w-3.5 h-3.5" /> Buka
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-dark-gray text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-peach-accent" />
                Analitik KKA
              </h3>
              <p className="text-xs text-dark-gray/60 mt-0.5">
                Progres audit wilayah Loli
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total KKA</p>
                <p className="text-2xl font-black text-slate-800">{stats.totalAudits}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">KKA Final</p>
                <p className="text-2xl font-black text-slate-800">{stats.completedAudits}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">KKA dalam proses</p>
                <p className="text-2xl font-black text-slate-800">{stats.inProgressAudits}</p>
              </div>
            </div>

            {stats.totalAudits > 0 && (
              <div className="mt-auto bg-peach-accent/10 rounded-xl p-4 border border-peach-accent/20">
                <p className="text-[10px] font-bold text-dark-gray/60 uppercase tracking-wider mb-2">Progres Keseluruhan</p>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-peach-accent h-2.5 rounded-full" style={{ width: `${(stats.completedAudits / stats.totalAudits) * 100}%` }}></div>
                </div>
                <p className="text-xs text-right mt-1.5 font-bold text-dark-gray">
                  {Math.round((stats.completedAudits / stats.totalAudits) * 100)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
