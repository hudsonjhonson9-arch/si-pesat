import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  placeholder: string;
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SearchableSelect({ options, placeholder, value, onChange, className = '' }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div 
        className="w-full text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none bg-white flex justify-between items-center cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch('');
        }}
      >
        <span className={selectedOption ? "text-slate-800 font-medium" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
             <Search className="w-3.5 h-3.5 text-slate-400" />
             <input 
               autoFocus
               type="text" 
               className="w-full text-xs outline-none bg-transparent" 
               placeholder="Cari..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-center text-slate-400">Tidak ditemukan</div>
            ) : (
              filtered.map(o => (
                <div 
                  key={o.value} 
                  className="px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 text-slate-700 font-medium border-b border-slate-50 last:border-0"
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
