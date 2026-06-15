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
  
  // Font Size Customizations
  const [fontSizeKop, setFontSizeKop] = useState(14);
  const [fontSizeTable, setFontSizeTable] = useState(11);
  
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
        <div style="margin-bottom: 4px;">
          <span style="display: inline-block; width: 25px; vertical-align: top;">${i + 1}.</span>
          <span style="display: inline-block; width: 350px; vertical-align: top;">${name}</span>
        </div>
      `).join('')
      : `<div style="margin-bottom: 4px;">(Belum ada tim pemeriksa)</div>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Sampul KKP - ${pada} - ${judul2}</title>
      </head>
      <body style="margin: 0; padding: 0; background: white;">
        <div id="clip-container" style="width: 100%; overflow: hidden; display: flex; justify-content: center; background: white;">
          <div id="page-wrapper" style="transform-origin: top center; background: white;">
            <div id="pdf-content" style="width: 210mm; height: 297mm; max-height: 297mm; overflow: hidden; padding: 25mm; box-sizing: border-box; background: white; font-family: 'Times New Roman', Times, serif; color: #000000;">
              
              <div style="text-align: center; margin-top: 40px;">
                <div style="font-size: ${fontSizeKop}pt; font-weight: bold; margin-bottom: 5px;">${instansi}</div>
                <div style="font-size: ${fontSizeKop + 2}pt; font-weight: bold; margin-bottom: 10px;">${lembaga}</div>
                <div style="font-size: ${fontSizeKop - 4}pt; margin-bottom: 40px;">${alamat.replace(/\n/g, '<br/>')}</div>
                <div style="font-size: ${fontSizeKop - 2}pt; font-weight: bold; margin-bottom: 10px;">${judul1}</div>
                <div style="font-size: ${fontSizeKop - 2}pt; font-weight: bold; margin-bottom: 10px;">${judul2}</div>
              </div>

              <div style="display: flex; justify-content: center; margin: 60px 0; height: 150px;">
                <svg width="46" height="150" viewBox="0 0 46 150" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="25" width="2" height="100" fill="#000000" />
                  <rect x="22" y="0" width="2" height="150" fill="#000000" />
                  <rect x="44" y="25" width="2" height="100" fill="#000000" />
                </svg>
              </div>

              <table style="width: 650px; margin-top: 40px; font-size: ${fontSizeTable}pt; line-height: 1.4; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; color: #000000;">
                <tr>
                  <td style="width: 220px; vertical-align: top; padding: 4px 0;">PADA</td>
                  <td style="width: 20px; text-align: center; vertical-align: top; padding: 4px 0;">:</td>
                  <td style="vertical-align: top; padding: 4px 0;">${pada}</td>
                </tr>
                <tr>
                  <td style="width: 220px; vertical-align: top; padding: 4px 0;">KECAMATAN</td>
                  <td style="width: 20px; text-align: center; vertical-align: top; padding: 4px 0;">:</td>
                  <td style="vertical-align: top; padding: 4px 0;">${kecamatan}</td>
                </tr>
                <tr>
                  <td style="width: 220px; vertical-align: top; padding: 4px 0;">KABUPATEN</td>
                  <td style="width: 20px; text-align: center; vertical-align: top; padding: 4px 0;">:</td>
                  <td style="vertical-align: top; padding: 4px 0;">${kabupaten}</td>
                </tr>
                <tr>
                  <td style="width: 220px; vertical-align: top; padding: 4px 0;">TANGGAL</td>
                  <td style="width: 20px; text-align: center; vertical-align: top; padding: 4px 0;">:</td>
                  <td style="vertical-align: top; padding: 4px 0;">${tanggal}</td>
                </tr>
                <tr>
                  <td style="width: 220px; vertical-align: top; padding: 4px 0;">TIM PEMERIKSA</td>
                  <td style="width: 20px; text-align: center; vertical-align: top; padding: 4px 0;">:</td>
                  <td style="vertical-align: top; padding: 4px 0;">${teamListHTML}</td>
                </tr>
              </table>

            </div>
          </div>
        </div>
        <script>
          function adjustScale() {
            var wrapper = document.getElementById('page-wrapper');
            var clipContainer = document.getElementById('clip-container');
            var containerWidth = window.innerWidth;
            var scale = 1;
            if (containerWidth < 794) {
              scale = (containerWidth - 20) / 794;
            }
            wrapper.style.transform = 'scale(' + scale + ')';
            var rect = wrapper.getBoundingClientRect();
            clipContainer.style.height = rect.height + 'px';
          }
          window.addEventListener('resize', adjustScale);
          adjustScale();
          window.onafterprint = function() { window.close(); };
        </script>
      </body>
      </html>
    `;
  }, [instansi, lembaga, alamat, judul1, judul2, pada, kecamatan, kabupaten, tanggal, finalTeamList, fontSizeKop, fontSizeTable]);

  const handleDownloadPdf = () => {
    // Use browser's native print dialog which renders identically to preview
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      setErrorMsg("Pop-up diblokir oleh browser. Izinkan pop-up untuk mencetak PDF.");
      return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    };
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const handleSaveToDokumen1 = async () => {
    if (!onSaveAsDokumen1) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const opt = {
        margin:       0,
        filename:     `Sampul_KKP_${pada.replace(/\s+/g, '_')}_${judul2.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, windowWidth: 794 },
        jsPDF:        { unit: 'cm', format: 'a4', orientation: 'portrait' as const }
      };
      
      const lib = typeof html2pdf === 'function' ? html2pdf : (html2pdf as any).default;
      if (!lib) throw new Error("Library pembuat PDF tidak ditemukan.");

      // Attempt to grab the perfectly styled DOM element directly from the preview iframe
      const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
      const element = iframeDoc?.getElementById('pdf-content');
      
      // Fallback to raw string if iframe is inaccessible
      const source = element || htmlContent;

      const pdfBlob = await lib().set(opt).from(source).output('blob');
      
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
            <h2 className="font-black text-sm tracking-wide uppercase">Cetak Sampul KKP - {judul2}</h2>
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
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-dark-gray/70 uppercase">Ukuran Font Kop (pt)</label>
                    <input type="number" min="8" max="24" value={fontSizeKop} onChange={e => setFontSizeKop(Number(e.target.value))} className="w-full text-xs border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-dark-gray/70 uppercase">Ukuran Font Isi (pt)</label>
                    <input type="number" min="8" max="20" value={fontSizeTable} onChange={e => setFontSizeTable(Number(e.target.value))} className="w-full text-xs border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray outline-none" />
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* Right Preview Panel */}
          <div className="w-full md:w-1/2 bg-slate-200 p-4 flex flex-col relative">
            <div className="absolute top-2 right-2 text-[10px] font-bold text-slate-500 uppercase bg-white/70 px-2 py-1 rounded backdrop-blur-sm z-10 pointer-events-none">
              PRATINJAU LANGSUNG
            </div>
            <div className="flex-1 bg-white overflow-hidden relative rounded border border-slate-300 shadow-inner">
              <iframe 
                srcDoc={htmlContent} 
                className="w-full h-full border-none"
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
            <button onClick={handleSaveToDokumen1} disabled={isSaving || isGeneratingPdf} className="flex items-center gap-2 px-5 py-2 bg-blue-100 text-blue-800 font-black text-xs rounded-lg border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer shadow-sm disabled:opacity-50">
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Menyimpan...' : 'Simpan ke Dokumen 1'}
            </button>
          )}
          <button onClick={handleDownloadPdf} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-peach-accent text-dark-gray font-black text-xs rounded-lg border border-dark-gray/10 hover:opacity-90 transition-opacity cursor-pointer shadow-sm disabled:opacity-50">
            <Printer className="w-3.5 h-3.5" />
            Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </div>
  );
}
