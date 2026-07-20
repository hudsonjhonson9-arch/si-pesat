import React, { useState } from 'react';
import { FileText, Video, ChevronRight } from 'lucide-react';

const GUIDE_PDF = 'https://drive.google.com/file/d/1CrUrmyh3VKxMgmNSsWUYoReMhU84kO4G/preview';
const TUTORIAL_VIDEO = 'https://drive.google.com/file/d/1EBgj2zg2JjhouxqcPJH52nYsJ0VixjKK/preview';

const tabs = [
  { id: 'pdf', label: 'Panduan PDF', icon: <FileText className="w-4 h-4" /> },
  { id: 'video', label: 'Video Tutorial', icon: <Video className="w-4 h-4" /> },
] as const;

export default function GuideView() {
  const [tab, setTab] = useState<'pdf' | 'video'>('pdf');

  return (
    <div className="space-y-4 animate-fade-in" id="guide-view">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-pastel-peach rounded-full" />
        <h2 className="text-lg font-black text-[var(--ink-soft)] tracking-tight">Panduan Aplikasi</h2>
      </div>

      <div className="flex gap-1 bg-white border border-pastel-blue/20 rounded-2xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.id
                ? 'bg-pastel-peach text-white shadow-sm'
                : 'text-dark-gray/50 hover:text-dark-gray hover:bg-pastel-blue/10'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-pastel-blue/20 shadow-sm overflow-hidden">
        {tab === 'pdf' ? (
          <iframe
            src={GUIDE_PDF}
            className="w-full h-[80vh]"
            allow="autoplay"
            title="Panduan SI-PESAT"
          />
        ) : (
          <iframe
            src={TUTORIAL_VIDEO}
            className="w-full h-[80vh]"
            allow="autoplay; encrypted-media"
            title="Video Tutorial SI-PESAT"
          />
        )}
      </div>
    </div>
  );
}
