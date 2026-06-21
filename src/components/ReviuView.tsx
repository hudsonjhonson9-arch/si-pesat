import React, { useMemo } from 'react';
import { OpdAudit } from '../types';
import { FileText, User, ArrowRight } from 'lucide-react';

interface ReviuViewProps {
  audits: OpdAudit[];
  onSelectAudit: (audit: OpdAudit, categoryId?: string) => void;
}

export default function ReviuView({ audits, onSelectAudit }: ReviuViewProps) {
  const reviewItems = useMemo(() => {
    return audits.flatMap(a =>
      a.categories
        .filter(c => c.status === 'Direview')
        .map(c => ({ audit: a, category: c }))
    );
  }, [audits]);

  if (reviewItems.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-dark-gray text-lg">Reviu</h2>
            <p className="text-xs text-dark-gray/60 mt-0.5">Reviu KKA oleh pengendali teknis</p>
          </div>
        </div>
        <div className="bg-baby-blue rounded-xl border border-dashed border-dark-gray/25 p-12 text-center select-none">
          <FileText className="w-12 h-12 text-dark-gray/30 mx-auto mb-3" />
          <p className="text-dark-gray font-bold text-sm">Tidak ada KKA yang perlu direviu</p>
          <p className="text-xs text-dark-gray/70 mt-1">Semua KKA telah selesai direviu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-dark-gray text-lg">Reviu</h2>
          <p className="text-xs text-dark-gray/60 mt-0.5">KKA yang menunggu reviu dari pengendali teknis</p>
        </div>
        <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded font-bold font-mono uppercase">
          {reviewItems.length} Perlu Reviu
        </span>
      </div>

      <div className="space-y-3">
        {reviewItems.map(({ audit, category }) => (
          <div
            key={`${audit.id}-${category.id}`}
            onClick={() => onSelectAudit(audit, category.id)}
            className="bg-white rounded-2xl border border-dark-gray/15 p-5 hover:bg-baby-blue/40 transition cursor-pointer shadow-sm flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-dark-gray text-sm">{audit.opdName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {category.name}
                </span>
                <span className="text-[10px] text-dark-gray/60 font-medium">
                  TA {audit.fiscalYear}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-dark-gray/70">
                <User className="w-3 h-3" />
                <span className="font-medium">{category.auditorName || 'Belum ditugaskan'}</span>
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
