import React, { useState, useMemo } from 'react';
import { X, Printer, FileText, Trash2, Plus } from 'lucide-react';
import { OpdAudit, UserProfile } from '../types';
import html2pdf from 'html2pdf.js';

interface NotaDinasGeneratorProps {
  audit: OpdAudit;
  activeCategory?: any;
  userProfiles?: UserProfile[];
  onClose: () => void;
}

export default function NotaDinasGenerator({ audit, activeCategory, userProfiles = [], onClose }: NotaDinasGeneratorProps) {
  const [instansi] = useState('PEMERINTAH KABUPATEN SUMBA BARAT');
  const [lembaga] = useState('I N S P E K T O R A T');
  const [alamat] = useState('Jalan Basuki Rahmat Nomor : 12 Waikabubak, Provinsi Nusa Tenggara Timur Telp.(0387) 21165, Fax.(0387) 21165, Email: inspektoratsumbabarat2026@gmail.com');
  
  const [kepada, setKepada] = useState('Inspektur Kabupaten Sumba Barat');
  const [dari, setDari] = useState('Inspektur Pembantu Wilayah IV');
  const [nomorSurat, setNomorSurat] = useState('10/IK.IPW IV/V/2026');
  const [tanggal, setTanggal] = useState('06 Mei 2026');
  const [lampiran, setLampiran] = useState('--');
  const auditName = activeCategory?.name || 'Audit Ketaatan';
  const [perihal, setPerihal] = useState(`Melakukan ${auditName}`);
  
  const [pembuka, setPembuka] = useState(`Sesuai Rencana Program Kerja Pengawasan Tahunan di Kabupaten Sumba Barat Tahun 2026, maka bersama ini kami mengajukan Rencana ${auditName} dengan rincian sebagai berikut :`);
  const [waktu, setWaktu] = useState('Waktu Pemeriksaan direncanakan selama 8 (delapan) hari kerja yaitu tanggal 11 Mei s/d 25 Mei 2026');
  
  const [pengendaliNama, setPengendaliNama] = useState('Abdullah Daud, S.E');
  
  const [marginTop, setMarginTop] = useState(5);
  const [marginBottom, setMarginBottom] = useState(25);
  const [marginLeft, setMarginLeft] = useState(30);
  const [marginRight, setMarginRight] = useState(30);
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaultTeam = [
    activeCategory?.auditorName || audit.auditorName || '',
    ...(activeCategory?.teamMembers || audit.teamMembers || [])
  ].filter(n => n !== '');
  
  const initialTeamData = Array.from(new Set(defaultTeam)).map((name, idx) => {
    return {
      id: Math.random().toString(),
      nama: name,
      jabatan: idx === 0 ? 'Ketua Tim' : 'Anggota Tim'
    };
  });

  const [teamList, setTeamList] = useState(initialTeamData);

  const handleUpdateTeam = (id: string, field: string, value: string) => {
    setTeamList(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleAddTeam = () => {
    setTeamList(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        nama: '',
        jabatan: 'Anggota Tim'
      }
    ]);
  };

  const handleRemoveTeam = (id: string) => {
    setTeamList(prev => prev.filter(t => t.id !== id));
  };

  const htmlContent = useMemo(() => {
    const teamRows = teamList.map((member, i) => `
      <tr>
        <td style="border: 1px solid black; padding: 8px 10px; text-align: center;">${i + 1}</td>
        <td style="border: 1px solid black; padding: 8px 10px;">${member.nama}</td>
        <td style="border: 1px solid black; padding: 8px 10px; text-align: center;">${member.jabatan}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Nota Dinas - ${audit.opdName}</title>
        <style>
          @media print {
            @page { 
              size: A4 portrait;
              margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm !important; 
            }
            html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
            #clip-container { overflow: visible !important; display: block !important; height: auto !important; }
            #page-wrapper { transform: none !important; width: auto !important; height: auto !important; }
            .pdf-page { 
              width: auto !important; 
              min-height: auto !important; 
              height: auto !important; 
              padding: 0 !important; 
              margin: 0 !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: white;">
        <div id="clip-container" style="width: 100%; overflow: hidden; display: flex; justify-content: center; background: white;">
          <div id="page-wrapper" style="transform-origin: top center; background: white;">
            <div class="pdf-page" id="pdf-content" style="width: 210mm; min-height: 297mm; padding: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm; box-sizing: border-box; background: white; font-family: 'Times New Roman', Times, serif; color: #000000; font-size: 11pt; line-height: 1.3;">
        
        <!-- KOP SURAT -->
        <table style="width: 100%;">
          <tr>
            <td style="width: 90px; text-align: center; vertical-align: middle;">
              <img src="https://raw.githubusercontent.com/hudsonjhonson9-arch/sekrebot/454f3b4b2c805ec163bf4525d82586c8944fb6c8/Lambang_Kabupaten_Sumba_Barat.png" alt="Logo" style="width: 80px; height: auto;" />
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <div style="font-size: 14pt; font-weight: bold; margin-bottom: 5px; white-space: nowrap;">${instansi}</div>
              <div style="font-size: 18pt; font-weight: bold; margin-bottom: 5px; letter-spacing: 2px; white-space: nowrap;">${lembaga}</div>
              <div style="font-size: 10pt; line-height: 1.2;">${alamat}</div>
            </td>
            <td style="width: 90px;"></td> <!-- Dummy cell for centering -->
          </tr>
        </table>
        <div style="border-bottom: 3px solid black; margin-top: 15px; margin-bottom: 25px;"></div>

        <div style="text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin-bottom: 25px;">
          NOTA DINAS
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 100px; padding: 2px 0;">Kepada</td>
            <td style="width: 20px; padding: 2px 0;">:</td>
            <td style="padding: 2px 0;">${kepada}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Dari</td>
            <td style="padding: 2px 0;">:</td>
            <td style="padding: 2px 0;">${dari}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Nomor</td>
            <td style="padding: 2px 0;">:</td>
            <td style="padding: 2px 0;">${nomorSurat}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Tanggal</td>
            <td style="padding: 2px 0;">:</td>
            <td style="padding: 2px 0;">${tanggal}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Lampiran</td>
            <td style="padding: 2px 0;">:</td>
            <td style="padding: 2px 0;">${lampiran}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Perihal</td>
            <td style="padding: 2px 0;">:</td>
            <td style="padding: 2px 0;">${perihal}</td>
          </tr>
        </table>
        
        <hr style="border-top: 1px solid black; margin-bottom: 20px;" />

        <div style="text-align: justify; margin-bottom: 15px;">
          ${pembuka}
        </div>

        <div style="font-weight: bold; margin-bottom: 10px;">Susunan Tim dan Obrik</div>
        <table style="width: 100%; margin-bottom: 15px;">
          <tr>
            <td style="width: 80px; vertical-align: top;">Obrik</td>
            <td style="width: 20px; vertical-align: top;">:</td>
            <td style="vertical-align: top;">
              <ul style="margin: 0; padding-left: 20px;">
                <li>${audit.opdName}</li>
              </ul>
            </td>
          </tr>
        </table>

        <div style="font-weight: bold; margin-bottom: 10px;">Susunan Tim</div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid black; padding: 8px 10px; width: 40px;">No</th>
            <th style="border: 1px solid black; padding: 8px 10px;">Pelaksana Kegiatan</th>
            <th style="border: 1px solid black; padding: 8px 10px; width: 150px;">Keterangan</th>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 8px 10px; text-align: center;">1</td>
            <td style="border: 1px solid black; padding: 8px 10px;">${pengendaliNama}</td>
            <td style="border: 1px solid black; padding: 8px 10px; text-align: center;">Pengendali Teknis</td>
          </tr>
        </table>

        <div style="margin-bottom: 5px; font-style: italic;">Anggota Tim Pemeriksa:</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid black; padding: 8px 10px; width: 40px;">No</th>
            <th style="border: 1px solid black; padding: 8px 10px;">Pelaksana Kegiatan</th>
            <th style="border: 1px solid black; padding: 8px 10px; width: 150px;">Keterangan</th>
          </tr>
          ${teamRows}
        </table>

        <div style="font-weight: bold; margin-bottom: 5px;">Pelaksanaan Pemeriksaan</div>
        <div style="text-align: justify; margin-bottom: 25px;">
          ${waktu}
        </div>

        <div style="text-align: justify; margin-bottom: 40px;">
          Demikian nota dinas ini disampaikan, mohon persetujuan Inspektur Kabupaten Sumba Barat.
        </div>

        <div style="width: 100%; display: block; overflow: hidden; page-break-inside: avoid;">
          <div style="float: right; width: 250px; text-align: center;">
            <div style="margin-bottom: 80px;">Inspektur Pembantu Wilayah IV</div>
            <div style="font-weight: bold; text-decoration: underline;">${pengendaliNama}</div>
          </div>
        </div>

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
  }, [instansi, lembaga, alamat, kepada, dari, nomorSurat, tanggal, lampiran, perihal, pembuka, audit.opdName, pengendaliNama, teamList, waktu, marginTop, marginBottom, marginLeft, marginRight]);

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      setErrorMsg("Pop-up diblokir oleh browser. Izinkan pop-up untuk mencetak PDF.");
      return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Cetak Nota Dinas</h2>
              <p className="text-xs text-slate-500 font-medium">Generate PDF Nota Dinas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Form Panel */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-slate-150 space-y-5 bg-slate-50/30">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor Surat</label>
                  <input type="text" value={nomorSurat} onChange={e => setNomorSurat(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal</label>
                  <input type="text" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Perihal</label>
                <input type="text" value={perihal} onChange={e => setPerihal(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-emerald-500" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Waktu Pemeriksaan</label>
                <textarea value={waktu} onChange={e => setWaktu(e.target.value)} rows={2} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-emerald-500" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Pengendali Teknis / Irban IV</label>
                <input type="text" value={pengendaliNama} onChange={e => setPengendaliNama(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-emerald-500" />
              </div>

              <details className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <summary className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100 flex items-center justify-between">
                  Pengaturan Margin (mm)
                </summary>
                <div className="p-4 grid grid-cols-2 gap-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Atas</label>
                    <input type="number" value={marginTop} onChange={e => setMarginTop(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bawah</label>
                    <input type="number" value={marginBottom} onChange={e => setMarginBottom(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kiri</label>
                    <input type="number" value={marginLeft} onChange={e => setMarginLeft(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kanan</label>
                    <input type="number" value={marginRight} onChange={e => setMarginRight(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-emerald-500" />
                  </div>
                </div>
              </details>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Daftar Tim Pemeriksa</label>
                <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200">
                  {teamList.map((member, i) => (
                    <div key={member.id} className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="col-span-2 flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Anggota Tim {i + 1}</span>
                        <button onClick={() => handleRemoveTeam(member.id)} className="text-red-400 hover:text-red-600 transition-colors p-1" title="Hapus Anggota Tim">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="col-span-2 mb-1">
                        <select 
                          className="w-full text-xs p-2 border border-slate-200 rounded focus:border-emerald-500 outline-none bg-white text-slate-600"
                          onChange={(e) => {
                            const profile = userProfiles.find(p => p.id === e.target.value);
                            if (profile) {
                              const profileName = profile.full_name || profile.email || '';
                              const exists = teamList.some(t => t.id !== member.id && t.nama.toLowerCase() === profileName.toLowerCase());
                              if (exists) {
                                alert('Anggota ini sudah ada dalam tim!');
                                e.target.value = '';
                                return;
                              }
                              handleUpdateTeam(member.id, 'nama', profileName);
                            }
                            // Reset select after picking so they can pick again if needed (or keep it as quick-fill)
                            e.target.value = '';
                          }}
                          value=""
                        >
                          <option value="" disabled>-- Pilih dari daftar user --</option>
                          {userProfiles
                            .filter(p => !teamList.some(t => t.nama.toLowerCase() === (p.full_name || p.email || '').toLowerCase()))
                            .map(p => (
                            <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                          ))}
                        </select>
                      </div>

                      <input type="text" placeholder="Nama" value={member.nama} onChange={e => handleUpdateTeam(member.id, 'nama', e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded outline-none focus:border-emerald-500" />
                      <input type="text" placeholder="Jabatan" value={member.jabatan} onChange={e => handleUpdateTeam(member.id, 'jabatan', e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded outline-none focus:border-emerald-500" />
                    </div>
                  ))}
                  {teamList.length === 0 && <div className="text-xs text-center text-slate-400 py-4">Tidak ada anggota tim</div>}
                  
                  <button
                    onClick={handleAddTeam}
                    className="w-full mt-2 py-2 border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Tambah Anggota Tim
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Preview Panel */}
          <div className="w-full md:w-1/2 bg-slate-200/50 p-4 flex flex-col relative">
            <div className="absolute top-6 right-6 text-[10px] font-bold text-slate-500 uppercase bg-white/70 px-2 py-1 rounded backdrop-blur-sm z-10 pointer-events-none shadow-sm border border-white">
              PRATINJAU LANGSUNG
            </div>
            <div className="flex-1 bg-white overflow-hidden relative rounded-xl border border-slate-300 shadow-inner">
              <iframe 
                srcDoc={htmlContent} 
                className="w-full h-full border-none"
                title="Preview"
              />
            </div>
            
            <div className="mt-4 flex items-center justify-end gap-3 shrink-0">
              <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold text-xs hover:bg-slate-200 rounded-xl transition-colors">
                Batal
              </button>
              <button 
                onClick={handleDownloadPdf} 
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" /> Cetak / Simpan PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
