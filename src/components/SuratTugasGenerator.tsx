import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Printer, FileText, Search, Save, Trash2, Plus } from 'lucide-react';
import { OpdAudit, UserProfile } from '../types';
import html2pdf from 'html2pdf.js';

interface SuratTugasGeneratorProps {
  audit: OpdAudit;
  activeCategory?: any;
  userProfiles?: UserProfile[];
  onClose: () => void;
}

export default function SuratTugasGenerator({ audit, activeCategory, userProfiles = [], onClose }: SuratTugasGeneratorProps) {
  const [instansi] = useState('PEMERINTAH KABUPATEN SUMBA BARAT');
  const [lembaga] = useState('I N S P E K T O R A T');
  const [alamat] = useState('Jalan Basuki Rahmat Nomor : 12 Waikabubak, Provinsi Nusa Tenggara Timur Telp.(0387) 21165, Fax.(0387) 21165, Email: inspektoratsumbabarat2026@gmail.com');
  
  const [nomorSurat, setNomorSurat] = useState('IK.156/ST/53.12/V/2026');
  const [dasar1, setDasar1] = useState('Keputusan Bupati Sumba Barat Nomor : KEP/HK/305/2026 tanggal 12 Maret 2026 tentang Perubahan atas Lampiran Keputusan Bupati Sumba Barat Nomor : KEP/HK/7/2026 tentang Program Kerja Pengawasan Tahunan Inspektorat Kabupaten Sumba Barat Tahun 2026;');
  const [dasar2, setDasar2] = useState('Nota Dinas dari Inspektur Pembantu Wilayah IV Nomor : 10/IK.IPW IV/V/2026 tanggal 06 Mei 2026;');
  
  const auditName = activeCategory?.name || 'Audit Ketaatan';
  const [untuk, setUntuk] = useState(`Melakukan ${auditName} pada ${audit.opdName} selama 8 (delapan) hari mulai tanggal 11 Mei 2026 sampai dengan 25 Mei 2026 sesuai PKPT tahun 2026.`);
  
  const [marginTop, setMarginTop] = useState(5);
  const [marginBottom, setMarginBottom] = useState(25);
  const [marginLeft, setMarginLeft] = useState(30);
  const [marginRight, setMarginRight] = useState(30);
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parse team
  const defaultTeam = [
    activeCategory?.auditorName || audit.auditorName || '',
    ...(activeCategory?.teamMembers || audit.teamMembers || [])
  ].filter(n => n !== '');
  
  const initialTeamData = Array.from(new Set(defaultTeam)).map((name, idx) => {
    const profile = userProfiles.find(p => p.full_name?.toLowerCase() === name.toLowerCase() || p.email?.toLowerCase() === name.toLowerCase());
    return {
      id: Math.random().toString(),
      nama: name,
      nip: profile?.nip || '-',
      pangkat: 'Penata Muda – III/a',
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
        nip: '',
        pangkat: '',
        jabatan: 'Anggota Tim'
      }
    ]);
  };

  const handleRemoveTeam = (id: string) => {
    setTeamList(prev => prev.filter(t => t.id !== id));
  };

  const htmlContent = useMemo(() => {
    const teamRows = teamList.map(member => `
      <tr>
        <td style="width: 140px; padding: 4px 0; vertical-align: top;">Nama</td>
        <td style="width: 20px; padding: 4px 0; vertical-align: top;">:</td>
        <td style="padding: 4px 0; vertical-align: top; font-weight: bold;">${member.nama}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; vertical-align: top;">NIP</td>
        <td style="padding: 4px 0; vertical-align: top;">:</td>
        <td style="padding: 4px 0; vertical-align: top;">${member.nip}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; vertical-align: top;">Pangkat / Golongan</td>
        <td style="padding: 4px 0; vertical-align: top;">:</td>
        <td style="padding: 4px 0; vertical-align: top;">${member.pangkat}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; vertical-align: top;">Jabatan</td>
        <td style="padding: 4px 0; vertical-align: top;">:</td>
        <td style="padding: 4px 0; vertical-align: top;">${member.jabatan}</td>
      </tr>
      <tr><td colspan="3" style="height: 10px;"></td></tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Surat Tugas - ${audit.opdName}</title>
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

        <!-- JUDUL -->
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="font-size: 12pt; font-weight: bold; text-decoration: underline;">SURAT PERINTAH TUGAS</div>
          <div>Nomor : ${nomorSurat}</div>
        </div>

        <!-- DASAR -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 80px; vertical-align: top;">Dasar</td>
            <td style="width: 20px; vertical-align: top;">:</td>
            <td style="vertical-align: top; text-align: justify;">
              <ol style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 5px;">${dasar1}</li>
                <li>${dasar2}</li>
              </ol>
            </td>
          </tr>
        </table>

        <!-- MEMERINTAHKAN -->
        <div style="text-align: center; font-weight: bold; margin-bottom: 20px; letter-spacing: 2px;">
          M E M E R I N T A H K A N
        </div>

        <!-- KEPADA -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 80px; vertical-align: top;">Kepada</td>
            <td style="width: 20px; vertical-align: top;">:</td>
            <td style="vertical-align: top;">
              <table style="width: 100%; border-collapse: collapse;">
                ${teamRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding-top: 10px;">Untuk</td>
            <td style="vertical-align: top; padding-top: 10px;">:</td>
            <td style="vertical-align: top; padding-top: 10px; text-align: justify;">
              ${untuk}
            </td>
          </tr>
        </table>

        <!-- TTD -->
        <div style="width: 100%; display: block; overflow: hidden; page-break-inside: avoid;">
          <div style="float: right; width: 300px;">
            <table style="width: 100%; margin-bottom: 15px;">
              <tr><td style="width: 100px;">Dikeluarkan di</td><td style="width: 10px;">:</td><td>Waikabubak</td></tr>
              <tr><td>Pada Tanggal</td><td>:</td><td>..............................</td></tr>
            </table>
            
            <div style="text-align: center;">
              <div>INSPEKTUR KABUPATEN SUMBA BARAT,</div>
              <div style="height: 80px;"></div>
              <div style="font-weight: bold; text-decoration: underline;">WERU RADDI KAKA ORA, SP</div>
              <div>PEMBINA TINGKAT I – IV/b</div>
              <div>NIP. 19791118 200312 2 012</div>
            </div>
          </div>
        </div>

        <!-- PARAF -->
        <div style="margin-top: 50px;">
          <table style="width: 300px; border-collapse: collapse; font-size: 9pt;">
            <tr>
              <th colspan="2" style="border: 1px solid black; padding: 5px;">Paraf Hierarki</th>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 5px;">Sekretaris Inspektorat</td>
              <td style="border: 1px solid black; padding: 5px; width: 60px;"></td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 5px;">Inspektur Pembantu Wilayah IV</td>
              <td style="border: 1px solid black; padding: 5px;"></td>
            </tr>
          </table>
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
  }, [instansi, lembaga, alamat, nomorSurat, dasar1, dasar2, teamList, untuk, marginTop, marginBottom, marginLeft, marginRight]);

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
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Cetak Surat Tugas</h2>
              <p className="text-xs text-slate-500 font-medium">Generate PDF Surat Tugas Audit</p>
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor Surat</label>
                <input type="text" value={nomorSurat} onChange={e => setNomorSurat(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Dasar 1</label>
                <textarea value={dasar1} onChange={e => setDasar1(e.target.value)} rows={3} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Dasar 2</label>
                <textarea value={dasar2} onChange={e => setDasar2(e.target.value)} rows={2} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Untuk</label>
                <textarea value={untuk} onChange={e => setUntuk(e.target.value)} rows={3} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-blue-500" />
              </div>

              <details className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <summary className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100 flex items-center justify-between">
                  Pengaturan Margin (mm)
                </summary>
                <div className="p-4 grid grid-cols-2 gap-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Atas</label>
                    <input type="number" value={marginTop} onChange={e => setMarginTop(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bawah</label>
                    <input type="number" value={marginBottom} onChange={e => setMarginBottom(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kiri</label>
                    <input type="number" value={marginLeft} onChange={e => setMarginLeft(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kanan</label>
                    <input type="number" value={marginRight} onChange={e => setMarginRight(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-blue-500" />
                  </div>
                </div>
              </details>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Daftar Anggota Tim</label>
                <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200">
                  {teamList.map((member, i) => (
                    <div key={member.id} className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="col-span-2 flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Anggota Tim {i + 1}</span>
                        <button onClick={() => handleRemoveTeam(member.id)} className="text-red-400 hover:text-red-600 transition-colors p-1" title="Hapus Anggota Tim">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="col-span-2 mb-1">
                        <select 
                          className="w-full text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none bg-white text-slate-600"
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
                              handleUpdateTeam(member.id, 'nip', profile.nip || '-');
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

                      <input type="text" placeholder="Nama" value={member.nama} onChange={e => handleUpdateTeam(member.id, 'nama', e.target.value)} className="text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none" />
                      <input type="text" placeholder="NIP" value={member.nip} onChange={e => handleUpdateTeam(member.id, 'nip', e.target.value)} className="text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none" />
                      <input type="text" placeholder="Pangkat/Golongan" value={member.pangkat} onChange={e => handleUpdateTeam(member.id, 'pangkat', e.target.value)} className="text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none" />
                      <input type="text" placeholder="Jabatan dalam Tim" value={member.jabatan} onChange={e => handleUpdateTeam(member.id, 'jabatan', e.target.value)} className="text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none" />
                    </div>
                  ))}
                  {teamList.length === 0 && <div className="text-xs text-center text-slate-400 py-4">Tidak ada anggota tim</div>}
                  
                  <button
                    onClick={handleAddTeam}
                    className="w-full mt-2 py-2 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
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
            
            {errorMsg && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 text-xs rounded-lg border border-red-200 shrink-0">
                {errorMsg}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-3 shrink-0">
              <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold text-xs hover:bg-slate-200 rounded-xl transition-colors">
                Batal
              </button>
              <button 
                onClick={handleDownloadPdf} 
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95"
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
