import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Printer, FileText, Search, CheckSquare, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { OpdAudit, UserProfile } from '../types';
import html2pdf from 'html2pdf.js';

interface CoverDocumentGeneratorProps {
  audit: OpdAudit;
  activeCategory?: any;
  userProfiles?: UserProfile[];
  onClose: () => void;
  onSaveAsDokumen1?: (file: File) => Promise<void>;
}

export default function CoverDocumentGenerator({ audit, activeCategory, userProfiles = [], onClose, onSaveAsDokumen1 }: CoverDocumentGeneratorProps) {
  const [instansi, setInstansi] = useState('PEMERINTAH KABUPATEN SUMBA BARAT');
  const [lembaga, setLembaga] = useState('INSPEKTORAT');
  const [alamat, setAlamat] = useState('Jl. Basuki Rahmat Kampung Sawah Kota Waikabubak\nTelp. (0387) 21165 – Email: inspektorat_kabsumbabarat@yahoo.com');
  const [judul1, setJudul1] = useState('KERTAS KERJA PEMERIKSAAN (KKP)');
  const [judul2, setJudul2] = useState(activeCategory?.name?.toUpperCase() || 'PEMERIKSAAN REGULER');
  
  const [pada, setPada] = useState(audit.opdName.toUpperCase());
  const [kecamatan, setKecamatan] = useState('LOLI');
  const [kabupaten, setKabupaten] = useState('SUMBA BARAT PROVINSI NUSA TENGGARA TIMUR');
  
  const [tanggal, setTanggal] = useState('25 Agustus 2025 s/d 8 September 2025 (10 HARI KERJA)');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Custom multi-select searchable dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTeam, setSearchTeam] = useState('');
  
  // Initial team members based on audit/category names if any, otherwise empty
  const [selectedNames, setSelectedNames] = useState<string[]>(() => {
    const defaultTeam = [
      activeCategory?.auditorName || audit.auditorName || '',
      ...(activeCategory?.teamMembers || audit.teamMembers || [])
    ].map(n => n.toUpperCase()).filter(n => n !== '');
    return Array.from(new Set(defaultTeam)); // deduplicate
  });

  const toggleName = (name: string) => {
    setSelectedNames(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const filteredProfiles = useMemo(() => {
    return userProfiles.filter(p => {
      const name = p.full_name || p.email || '';
      return name.toLowerCase().includes(searchTeam.toLowerCase()) || 
             (p.nip && p.nip.includes(searchTeam));
    });
  }, [userProfiles, searchTeam]);

  // Keep manual override just in case
  const [manualNamesText, setManualNamesText] = useState('');

  const finalTeamList = useMemo(() => {
    const manualNames = manualNamesText.split('\n').map(n => n.trim()).filter(n => n !== '');
    return [...selectedNames, ...manualNames];
  }, [selectedNames, manualNamesText]);

  const htmlContent = useMemo(() => {
    const teamListHTML = finalTeamList.length > 0 
      ? finalTeamList.map((name, i) => `
        <tr>
          <td style="width: 20px; vertical-align: top;">${i + 1}.</td>
          <td style="vertical-align: top;">${name}</td>
        </tr>
      `).join('')
      : `<tr><td>(Belum ada tim pemeriksa)</td></tr>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Sampul KKP - ${pada}</title>
        <style>
          @media print {
            @page { size: A4; margin: 0; }
            body { padding: 0 !important; margin: 0 !important; -webkit-print-color-adjust: exact; }
            .page { padding: 2.5cm !important; width: 21cm; min-height: 29.7cm; box-sizing: border-box; margin: 0; border: none; box-shadow: none; }
          }
          body { 
            font-family: "Times New Roman", Times, serif; 
            margin: 0; 
            padding: 20px 0; 
            background: white;
            color: black;
            display: flex;
            justify-content: center;
          }
          .page {
            width: 21cm;
            min-height: 29.7cm;
            padding: 2.5cm;
            box-sizing: border-box;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin: 20px 0;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .header-instansi { font-size: 14pt; font-weight: bold; margin-bottom: 5px; }
          .header-lembaga { font-size: 16pt; font-weight: bold; margin-bottom: 10px; }
          .header-alamat { font-size: 10pt; margin-bottom: 40px; }
          .judul { font-size: 12pt; font-weight: bold; margin-bottom: 10px; }
          .center-lines { display: flex; justify-content: center; gap: 20px; margin: 60px 0; height: 150px; }
          .line-short { width: 1.5px; background-color: black; height: 100px; margin-top: 25px; }
          .line-long { width: 1.5px; background-color: black; height: 150px; }
          .info-table { width: 100%; margin-top: 40px; border-collapse: collapse; font-size: 11pt; line-height: 1.4; }
          .info-table td { padding: 4px 0; vertical-align: top; }
          .col-label { width: 160px; }
          .col-colon { width: 20px; text-align: center; }
          .team-table { border-collapse: collapse; width: 100%; }
          .team-table td { padding: 2px 0; }
        </style>
      </head>
      <body>
        <div class="page" id="pdf-content">
        <div class="text-center">
          <div class="header-instansi">${instansi}</div>
          <div class="header-lembaga">${lembaga}</div>
          <div class="header-alamat">${alamat.replace(/\n/g, '<br/>')}</div>
          <div class="judul">${judul1}</div>
          <div class="judul">${judul2}</div>
        </div>
        <div class="center-lines">
          <div class="line-short"></div>
          <div class="line-long"></div>
          <div class="line-short"></div>
        </div>
        <table class="info-table">
          <tr><td class="col-label">PADA</td><td class="col-colon">:</td><td>${pada}</td></tr>
          <tr><td class="col-label">KECAMATAN</td><td class="col-colon">:</td><td>${kecamatan}</td></tr>
          <tr><td class="col-label">KABUPATEN</td><td class="col-colon">:</td><td>${kabupaten}</td></tr>
          <tr><td class="col-label">TANGGAL</td><td class="col-colon">:</td><td>${tanggal}</td></tr>
          <tr>
            <td class="col-label">TIM PEMERIKSA</td>
            <td class="col-colon">:</td>
            <td><table class="team-table">${teamListHTML}</table></td>
          </tr>
        </table>
        </div>
        <script>
          window.onafterprint = function() { window.close(); };
        </script>
      </body>
      </html>
    `;
  }, [instansi, lembaga, alamat, judul1, judul2, pada, kecamatan, kabupaten, tanggal, finalTeamList]);

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const handlePrint = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const opt = {
        margin:       0,
        filename:     `Sampul_KKP_${pada.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'cm', format: 'a4', orientation: 'portrait' as const }
      };
      
      const lib = typeof html2pdf === 'function' ? html2pdf : (html2pdf as any).default;
      if (!lib) throw new Error("Library pembuat PDF tidak ditemukan.");

      const pdfBlob = await lib().set(opt).from(htmlContent).output('blob');
      
      const url = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(url);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal membuat Pratinjau PDF: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSaveToDokumen1 = async () => {
    if (!onSaveAsDokumen1) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const opt = {
        margin:       0,
        filename:     `Sampul_KKP_${pada.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'cm', format: 'a4', orientation: 'portrait' as const }
      };
      
      const lib = typeof html2pdf === 'function' ? html2pdf : (html2pdf as any).default;
      if (!lib) throw new Error("Library pembuat PDF tidak ditemukan.");

      const pdfBlob = await lib().set(opt).from(htmlContent).output('blob');
      
      const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
      await onSaveAsDokumen1(file);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal menyimpan dokumen: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-gray/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-dark-gray/10 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-dark-gray">
            <FileText className="w-5 h-5 text-peach-accent" />
            <h2 className="font-black text-sm tracking-wide uppercase">Cetak Sampul KKP</h2>
          </div>
          {errorMsg && <div className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded">{errorMsg}</div>}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark-gray/10 text-dark-gray/60 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Form Panel */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-slate-150 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">PADA (Nama Objek / Instansi)</label>
                <input type="text" value={pada} onChange={e => setPada(e.target.value)} className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded bg-white text-dark-gray outline-none focus:border-peach-accent" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Kecamatan</label>
                <input type="text" value={kecamatan} onChange={e => setKecamatan(e.target.value)} className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded bg-white text-dark-gray outline-none focus:border-peach-accent" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Kabupaten</label>
                <input type="text" value={kabupaten} onChange={e => setKabupaten(e.target.value)} className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded bg-white text-dark-gray outline-none focus:border-peach-accent" />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Tanggal Pemeriksaan</label>
                <input type="text" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded bg-white text-dark-gray outline-none focus:border-peach-accent" />
              </div>

              <div className="space-y-1 col-span-2" ref={dropdownRef}>
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase flex justify-between">
                  <span>Tim Pemeriksa (Dari Database)</span>
                  <span className="text-peach-accent">{selectedNames.length} Terpilih</span>
                </label>
                <div className="relative">
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded bg-white text-dark-gray cursor-pointer flex justify-between items-center"
                  >
                    <span className="truncate">{selectedNames.length > 0 ? selectedNames.join(', ') : 'Pilih Anggota Tim...'}</span>
                    {isDropdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Cari nama atau NIP..." 
                          value={searchTeam}
                          onChange={e => setSearchTeam(e.target.value)}
                          className="w-full text-xs bg-transparent outline-none"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1">
                        {filteredProfiles.length === 0 ? (
                          <div className="p-3 text-xs text-center text-slate-400 italic">Tidak ada user ditemukan</div>
                        ) : (
                          filteredProfiles.map(p => {
                            const displayName = p.full_name || p.email || '';
                            const nameUpper = displayName.toUpperCase();
                            const isSelected = selectedNames.includes(nameUpper);
                            return (
                              <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                <div className={`flex items-center justify-center w-4 h-4 rounded border ${isSelected ? 'bg-peach-accent border-peach-accent text-white' : 'border-slate-300 text-transparent'}`}>
                                  <CheckSquare className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-dark-gray">{displayName}</span>
                                  <span className="text-[10px] text-slate-500">{p.role} {p.nip ? `- ${p.nip}` : ''}</span>
                                </div>
                                <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  checked={isSelected}
                                  onChange={() => toggleName(nameUpper)}
                                />
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-dark-gray/50 font-bold mt-1">Urutan pilihan akan menentukan urutan di sampul.</p>
              </div>

              <div className="space-y-1 col-span-2 mt-2">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Tim Pemeriksa Tambahan (Manual)</label>
                <textarea 
                  value={manualNamesText} 
                  onChange={e => setManualNamesText(e.target.value)} 
                  rows={2}
                  placeholder="Tambahkan nama manual jika tidak ada di database (1 baris = 1 nama)"
                  className="w-full text-xs border border-dark-gray/15 p-2 rounded bg-white text-dark-gray outline-none focus:border-peach-accent" 
                />
              </div>
              
              {/* Header Configuration Toggle */}
              <details className="col-span-2 mt-2 bg-slate-50 p-3 rounded border border-dark-gray/10 group cursor-pointer">
                <summary className="text-[10px] font-bold text-dark-gray/80 uppercase select-none flex items-center gap-2">
                  PENGATURAN KOP & JUDUL (Lanjutan)
                </summary>
                <div className="space-y-3 mt-3 pt-3 border-t border-dark-gray/10 cursor-auto grid grid-cols-2 gap-x-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-dark-gray/70 uppercase">Instansi</label>
                    <input type="text" value={instansi} onChange={e => setInstansi(e.target.value)} className="w-full text-xs border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-dark-gray/70 uppercase">Lembaga</label>
                    <input type="text" value={lembaga} onChange={e => setLembaga(e.target.value)} className="w-full text-xs border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray outline-none" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-bold text-dark-gray/70 uppercase">Alamat</label>
                    <textarea value={alamat} onChange={e => setAlamat(e.target.value)} rows={2} className="w-full text-xs border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-dark-gray/70 uppercase">Judul Atas</label>
                    <input type="text" value={judul1} onChange={e => setJudul1(e.target.value)} className="w-full text-xs border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-dark-gray/70 uppercase">Judul Bawah</label>
                    <input type="text" value={judul2} onChange={e => setJudul2(e.target.value)} className="w-full text-xs border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray outline-none" />
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* Right Preview Panel */}
          <div className="w-full md:w-1/2 bg-slate-200 p-4 flex flex-col relative">
            <div className="absolute top-2 right-2 text-[10px] font-bold text-slate-500 uppercase bg-white/50 px-2 py-1 rounded backdrop-blur-sm z-10 pointer-events-none">
              Pratinjau Langsung
            </div>
            <div className="flex-1 bg-white shadow-lg rounded overflow-hidden border border-slate-300">
              <iframe 
                srcDoc={htmlContent} 
                className="w-full h-full border-none pointer-events-auto"
                title="Preview"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-dark-gray/10 bg-white flex justify-end gap-2 shrink-0">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-100 text-dark-gray font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50">
            Batal
          </button>
          {onSaveAsDokumen1 && (
            <button onClick={handleSaveToDokumen1} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-blue-100 text-blue-800 font-black text-xs rounded-lg border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer shadow-sm disabled:opacity-50">
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Menyimpan...' : 'Simpan ke Dokumen 1'}
            </button>
          )}
          <button onClick={handlePrint} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-peach-accent text-dark-gray font-black text-xs rounded-lg border border-dark-gray/10 hover:opacity-90 transition-opacity cursor-pointer shadow-sm disabled:opacity-50">
            <Printer className="w-3.5 h-3.5" />
            Pratinjau & Cetak PDF
          </button>
        </div>
      </div>

      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-dark-gray/80 p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-dark-gray/10 bg-slate-50 shrink-0">
              <h2 className="font-black text-sm tracking-wide uppercase text-dark-gray">Pratinjau PDF (Siap Cetak & Unduh)</h2>
              <button 
                onClick={() => { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark-gray/10 text-dark-gray/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-200 p-2 md:p-4">
               <iframe src={pdfPreviewUrl} className="w-full h-full border-none rounded shadow-sm" title="PDF Preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
