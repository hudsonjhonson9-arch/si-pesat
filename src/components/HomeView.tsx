import React, { useMemo } from 'react';
import { TargetEntity, OpdAudit } from '../types';
import { Building, BarChart3, CheckCircle, FileText, AlertTriangle, Clock } from 'lucide-react';

interface HomeViewProps {
  targetEntities: TargetEntity[];
  audits?: OpdAudit[];
  onSelectAudit?: (audit: OpdAudit, categoryId?: string) => void;
  userRole?: string;
  isAdmin?: boolean;
}



export default function HomeView({ targetEntities, audits = [], onSelectAudit, userRole, isAdmin = false }: HomeViewProps) {

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

  const categoriesToReview = useMemo(() => {
    return audits.flatMap(a => 
      a.categories
        .filter(c => c.status === 'Direview')
        .map(c => ({ audit: a, category: c }))
    );
  }, [audits]);

  // Audit dengan milestone melewati tenggat (targetDate sudah lewat, status belum Selesai)
  const overdueItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: { audit: OpdAudit; milestoneName: string; targetDate: string; daysOverdue: number }[] = [];
    audits.forEach(audit => {
      if (audit.status === 'Selesai') return;
      (audit.schedule || []).forEach(milestone => {
        if (milestone.status === 'Selesai') return;
        const target = new Date(milestone.targetDate);
        target.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) {
          result.push({ audit, milestoneName: milestone.name, targetDate: milestone.targetDate, daysOverdue: diff });
        }
      });
    });
    return result.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [audits]);

  return (
    <div className="space-y-6 animate-fade-in" id="home-view">
      {/* Notifications Banner */}
      {(userRole === 'Inspektur Pembantu' || userRole === 'Inspektur') && categoriesToReview.length > 0 && (
        <div className="bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-200/50 p-2 rounded-full">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="font-bold text-sm">Menunggu Review Anda</p>
              <p className="text-xs text-amber-700/80">
                Terdapat <strong>{categoriesToReview.length} Jenis Audit</strong> yang diajukan oleh Ketua Tim dan membutuhkan review Anda.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {categoriesToReview.map(({ audit, category }) => (
              <button
                key={`${audit.id}-${category.id}`}
                onClick={() => onSelectAudit && onSelectAudit(audit, category.id)}
                className="flex items-center gap-2 bg-white/60 hover:bg-white text-xs font-bold px-3 py-2 rounded-lg border border-amber-200/50 transition-colors cursor-pointer shadow-sm text-left"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                <div>
                  <span className="text-dark-gray">{audit.opdName}</span>
                  <span className="text-amber-700/70 ml-1">({category.name})</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Milestone Banner — untuk Inspektur/Irban */}
      {(userRole === 'Inspektur Pembantu' || userRole === 'Inspektur') && overdueItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-rose-200/50 p-2 rounded-full">
              <Clock className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <p className="font-bold text-sm">Tenggat Waktu Terlewat</p>
              <p className="text-xs text-rose-700/80">
                <strong>{overdueItems.length} milestone</strong> pada audit aktif telah melewati target tanggal penyelesaian.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {overdueItems.slice(0, 6).map(({ audit, milestoneName, targetDate, daysOverdue }, idx) => (
              <button
                key={`${audit.id}-${milestoneName}-${idx}`}
                onClick={() => onSelectAudit && onSelectAudit(audit)}
                className="flex items-center gap-2 bg-white/70 hover:bg-white text-xs font-bold px-3 py-2 rounded-lg border border-rose-200/60 transition-colors cursor-pointer shadow-sm text-left"
              >
                <Clock className="w-3 h-3 text-rose-500 flex-shrink-0" />
                <div>
                  <span className="text-dark-gray">{audit.opdName}</span>
                  <span className="text-rose-600 ml-1">({milestoneName.split(' (')[0]})</span>
                  <span className="ml-1.5 text-[9px] font-black text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                    +{daysOverdue}h
                  </span>
                </div>
              </button>
            ))}
            {overdueItems.length > 6 && (
              <span className="flex items-center text-[10px] font-bold text-rose-600 px-2">+{overdueItems.length - 6} lainnya</span>
            )}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div 
        className="rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden bg-slate-900 bg-center bg-cover"
        style={{ backgroundImage: "url('/header-bg.jpg')" }}
      >
        {/* Overlay gradient so text is readable over the background image */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-dark-gray/10 shadow-sm flex flex-col">
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
