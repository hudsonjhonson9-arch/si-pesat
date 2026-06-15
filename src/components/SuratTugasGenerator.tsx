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
  
  const [untuk, setUntuk] = useState(`Melakukan Audit Ketaatan pada ${audit.opdName} selama 8 (delapan) hari mulai tanggal 11 Mei 2026 sampai dengan 25 Mei 2026 sesuai PKPT tahun 2026.`);
  
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
      <div id="pdf-content" style="width: 210mm; min-height: 297mm; padding: 25mm 20mm; box-sizing: border-box; background: white; font-family: 'Times New Roman', Times, serif; color: #000000; font-size: 11pt; line-height: 1.3;">
        
        <!-- KOP SURAT -->
        <div style="text-align: center; border-bottom: 3px solid black; padding-bottom: 15px; margin-bottom: 25px; position: relative;">
          <img src="https://raw.githubusercontent.com/hudsonjhonson9-arch/sekrebot/454f3b4b2c805ec163bf4525d82586c8944fb6c8/Lambang_Kabupaten_Sumba_Barat.png" alt="Logo" style="position: absolute; left: 0; top: 0; width: 75px; height: auto;" />
          <div style="font-size: 14pt; font-weight: bold; margin-bottom: 5px;">${instansi}</div>
          <div style="font-size: 18pt; font-weight: bold; margin-bottom: 5px; letter-spacing: 2px;">${lembaga}</div>
          <div style="font-size: 10pt;">${alamat}</div>
        </div>

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
        <div style="display: flex; justify-content: flex-end; margin-top: 40px;">
          <div style="width: 300px; text-align: left;">
            <table style="width: 100%;">
              <tr>
                <td style="width: 80px;">Dikeluarkan di</td>
                <td style="width: 10px;">:</td>
                <td>Waikabubak</td>
              </tr>
              <tr>
                <td>Pada Tanggal</td>
                <td>:</td>
                <td>..............................</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; text-align: center;">
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
    `;
  }, [instansi, lembaga, alamat, nomorSurat, dasar1, dasar2, teamList, untuk]);

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    setErrorMsg(null);
    try {
      const opt = {
        margin:       0,
        filename:     `Surat_Tugas_${audit.opdName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, windowWidth: 794 },
        jsPDF:        { unit: 'cm', format: 'a4', orientation: 'portrait' as const },
        pagebreak:    { mode: 'avoid-all' }
      };
      
      const lib = typeof html2pdf === 'function' ? html2pdf : (html2pdf as any).default;
      const element = document.getElementById('pdf-content');
      await lib().set(opt).from(element || htmlContent).save();
    } catch (err: any) {
      setErrorMsg("Gagal membuat PDF: " + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
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
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tujuan / Maksud (Untuk)</label>
                <textarea value={untuk} onChange={e => setUntuk(e.target.value)} rows={3} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Daftar Anggota Tim</label>
                <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200">
                  {teamList.map((member, i) => (
                    <div key={member.id} className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="col-span-2 flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Personil {i + 1}</span>
                        <button onClick={() => handleRemoveTeam(member.id)} className="text-red-400 hover:text-red-600 transition-colors p-1" title="Hapus Personil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="col-span-2 mb-1">
                        <select 
                          className="w-full text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none bg-white text-slate-600"
                          onChange={(e) => {
                            const profile = userProfiles.find(p => p.id === e.target.value);
                            if (profile) {
                              handleUpdateTeam(member.id, 'nama', profile.full_name || profile.email || '');
                              handleUpdateTeam(member.id, 'nip', profile.nip || '-');
                            }
                          }}
                        >
                          <option value="">-- Pilih dari daftar user --</option>
                          {userProfiles.map(p => (
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
                    <Plus className="w-4 h-4" /> Tambah Personil
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Preview Panel */}
          <div className="w-full md:w-1/2 bg-slate-200/50 flex flex-col p-4">
            <div className="flex-1 overflow-auto flex justify-center items-start rounded-xl border border-slate-200/60 bg-slate-300/30 p-4 custom-scrollbar">
              <div 
                className="bg-white shadow-xl origin-top transition-transform"
                style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.85)' }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
            
            {errorMsg && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 text-xs rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold text-xs hover:bg-slate-200 rounded-xl transition-colors">
                Batal
              </button>
              <button 
                onClick={handleGeneratePdf} 
                disabled={isGeneratingPdf} 
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
                ) : (
                  <><Printer className="w-4 h-4" /> Download PDF</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
