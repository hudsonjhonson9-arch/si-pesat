import React, { useMemo } from 'react';
import { OpdAudit } from '../types';
import { FileText, ArrowRight, CheckCircle } from 'lucide-react';

interface EvaluasiViewProps {
  audits: OpdAudit[];
  onSelectAudit: (audit: OpdAudit, categoryId?: string) => void;
}

export default function EvaluasiView({ audits, onSelectAudit }: EvaluasiViewProps) {
  const evaluasiItems = useMemo(() => {
    return audits.filter(a => a.status === 'Selesai' || a.status === 'Sedang Berjalan');
  }, [audits]);

  if (evaluasiItems.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-dark-gray text-lg">Evaluasi</h2>
            <p className="text-xs text-dark-gray/60 mt-0.5">Evaluasi pelaksanaan pengawasan</p>
          </div>
        </div>
        <div className="bg-baby-blue rounded-xl border border-dashed border-dark-gray/25 p-12 text-center select-none">
          <FileText className="w-12 h-12 text-dark-gray/30 mx-auto mb-3" />
          <p className="text-dark-gray font-bold text-sm">Tidak ada KKA untuk dievaluasi</p>
          <p className="text-xs text-dark-gray/70 mt-1">Belum ada KKA yang siap dievaluasi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-dark-gray text-lg">Evaluasi</h2>
          <p className="text-xs text-dark-gray/60 mt-0.5">Evaluasi hasil pemeriksaan</p>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded font-bold font-mono uppercase">
          {evaluasiItems.length} KKA
        </span>
      </div>

      <div className="space-y-3">
        {evaluasiItems.map(audit => (
          <div
            key={audit.id}
            onClick={() => onSelectAudit(audit)}
            className="bg-white rounded-2xl border border-dark-gray/15 p-5 hover:bg-baby-blue/40 transition cursor-pointer shadow-sm flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-dark-gray text-sm">{audit.opdName}</h3>
                {audit.status === 'Selesai' && (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-peach-accent/20 text-dark-gray px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {audit.auditType}
                </span>
                <span className="text-[10px] text-dark-gray/60 font-medium">
                  TA {audit.fiscalYear}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase border ${
                  audit.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {audit.status}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-dark-gray text-white flex items-center justify-center shadow-md hover:bg-peach-accent transition-all duration-300 shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
