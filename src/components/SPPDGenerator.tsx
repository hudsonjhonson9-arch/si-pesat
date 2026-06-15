import React, { useState, useMemo } from 'react';
import { X, Printer, FileText, Trash2, Plus } from 'lucide-react';
import { OpdAudit, UserProfile } from '../types';
import html2pdf from 'html2pdf.js';

interface SPPDGeneratorProps {
  audit: OpdAudit;
  activeCategory?: any;
  userProfiles?: UserProfile[];
  onClose: () => void;
}

export default function SPPDGenerator({ audit, activeCategory, userProfiles = [], onClose }: SPPDGeneratorProps) {
  const [instansi] = useState('PEMERINTAH KABUPATEN SUMBA BARAT');
  const [lembaga] = useState('I N S P E K T O R A T');
  const [alamat] = useState('Jalan Basuki Rahmat Nomor : 12 Waikabubak, Provinsi Nusa Tenggara Timur Telp.(0387) 21165, Fax.(0387) 21165, Email: inspektoratsumbabarat2026@gmail.com');
  
  const [nomorSurat, setNomorSurat] = useState('425 / SPPD / 2026');
  const auditName = activeCategory?.name || 'Audit Ketaatan';
  const [maksud, setMaksud] = useState(`Melakukan ${auditName}`);
  const [tempatTujuan, setTempatTujuan] = useState(audit.opdName);
  const [lamanya, setLamanya] = useState('Selama 8 (delapan) hari');
  const [tglBerangkat, setTglBerangkat] = useState('11 Mei 2026');
  const [tglKembali, setTglKembali] = useState('25 Mei 2026');
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    const pages = teamList.map((member, idx) => `
      <div style="width: 210mm; min-height: 297mm; padding: 15mm 30mm 25mm 30mm; box-sizing: border-box; background: white; font-family: 'Times New Roman', Times, serif; color: #000000; font-size: 11pt; line-height: 1.3; ${idx > 0 ? 'page-break-before: always;' : ''}">
        
        <!-- KOP SURAT -->
        <table style="width: 100%;">
          <tr>
            <td style="width: 90px; text-align: center; vertical-align: middle;">
              <img src="https://raw.githubusercontent.com/hudsonjhonson9-arch/sekrebot/454f3b4b2c805ec163bf4525d82586c8944fb6c8/Lambang_Kabupaten_Sumba_Barat.png" alt="Logo" style="width: 80px; height: auto;" />
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <div style="font-size: 14pt; font-weight: bold; margin-bottom: 5px;">${instansi}</div>
              <div style="font-size: 18pt; font-weight: bold; margin-bottom: 5px; letter-spacing: 2px;">${lembaga}</div>
              <div style="font-size: 10pt; line-height: 1.2;">${alamat}</div>
            </td>
            <td style="width: 90px;"></td> <!-- Dummy cell for centering -->
          </tr>
        </table>
        <div style="border-bottom: 3px solid black; margin-top: 15px; margin-bottom: 25px;"></div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
          <table style="width: 300px;">
            <tr><td style="width: 80px;">Lembar Ke</td><td style="width: 10px;">:</td><td></td></tr>
            <tr><td>Kode No.</td><td>:</td><td></td></tr>
            <tr><td>Nomor</td><td>:</td><td>${nomorSurat}</td></tr>
          </table>
        </div>

        <div style="text-align: center; font-size: 12pt; font-weight: bold; text-decoration: underline; margin-bottom: 20px;">
          SURAT PERJALANAN DINAS (SPD)
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr>
            <td style="border: 1px solid black; padding: 6px; width: 30px; text-align: center; vertical-align: top;">1</td>
            <td style="border: 1px solid black; padding: 6px; width: 250px; vertical-align: top;">Pengguna Anggaran / Kuasa Pengguna Anggaran</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">INSPEKTUR KABUPATEN SUMBA BARAT</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">2</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">Nama/NIP Pegawai yang melaksanakan perjalanan dinas</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top; font-weight: bold;">
              ${member.nama} /<br/>${member.nip}
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">3</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">
              a. Pangkat dan Golongan<br/>
              b. Jabatan<br/>
              c. Tingkat Biaya Perjalanan Dinas
            </td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">
              a. ${member.pangkat}<br/>
              b. ${member.jabatan}<br/>
              c. 
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">4</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">Maksud Perjalanan Dinas</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">${maksud}</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">5</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">Alat Angkut yang dipergunakan</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">Mobil / Motor</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">6</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">
              a. Tempat Berangkat<br/>
              b. Tempat Tujuan
            </td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">
              a. Waikabubak<br/>
              b. ${tempatTujuan}
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">7</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">
              a. Lamanya Perjalanan Dinas<br/>
              b. Tanggal Berangkat<br/>
              c. Tanggal harus kembali
            </td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">
              a. ${lamanya}<br/>
              b. ${tglBerangkat}<br/>
              c. ${tglKembali}
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">8</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">Pengikut</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">-</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">9</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">
              Pembebanan Anggaran<br/>
              a. SKPD<br/>
              b. Kode Rekening
            </td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">
              <br/>
              Dokumen Pelaksanaan Anggaran<br/>
              Inspektorat Kabupaten Sumba Barat
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">10</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">Keterangan lain-lain</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;"></td>
          </tr>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 300px;">
            <table style="width: 100%; margin-bottom: 15px;">
              <tr><td style="width: 100px;">Dikeluarkan di</td><td style="width: 10px;">:</td><td>Waikabubak</td></tr>
              <tr><td>Pada Tanggal</td><td>:</td><td>${tglBerangkat}</td></tr>
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

      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak SPPD - ${audit.opdName}</title>
      </head>
      <body style="margin: 0; padding: 0; background: white;">
        <div id="clip-container" style="width: 100%; overflow: hidden; display: flex; justify-content: center; background: white;">
          <div id="page-wrapper" style="transform-origin: top center; background: white;">
            ${pages}
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
  }, [instansi, lembaga, alamat, nomorSurat, maksud, tempatTujuan, lamanya, tglBerangkat, tglKembali, teamList]);

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
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Cetak SPPD</h2>
              <p className="text-xs text-slate-500 font-medium">Generate PDF Surat Perjalanan Dinas</p>
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
                <input type="text" value={nomorSurat} onChange={e => setNomorSurat(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Maksud Perjalanan</label>
                <input type="text" value={maksud} onChange={e => setMaksud(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tempat Tujuan</label>
                  <input type="text" value={tempatTujuan} onChange={e => setTempatTujuan(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Lama Perjalanan</label>
                  <input type="text" value={lamanya} onChange={e => setLamanya(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Berangkat</label>
                  <input type="text" value={tglBerangkat} onChange={e => setTglBerangkat(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Kembali</label>
                  <input type="text" value={tglKembali} onChange={e => setTglKembali(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Data Anggota Tim (Akan dicetak {teamList.length} halaman)</label>
                <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200">
                  {teamList.map((member, i) => (
                    <div key={member.id} className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="col-span-2 flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Personil {i + 1}</span>
                        <button onClick={() => handleRemoveTeam(member.id)} className="text-red-400 hover:text-red-600 transition-colors p-1" title="Hapus Personil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="col-span-2 mb-1">
                        <select 
                          className="w-full text-xs p-2 border border-slate-200 rounded focus:border-purple-500 outline-none bg-white text-slate-600"
                          onChange={(e) => {
                            const profile = userProfiles.find(p => p.id === e.target.value);
                            if (profile) {
                              const profileName = profile.full_name || profile.email || '';
                              const exists = teamList.some(t => t.id !== member.id && t.nama.toLowerCase() === profileName.toLowerCase());
                              if (exists) {
                                alert('Personil ini sudah ada dalam tim!');
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

                      <input type="text" placeholder="Nama" value={member.nama} onChange={e => handleUpdateTeam(member.id, 'nama', e.target.value)} className="text-xs p-2 border border-slate-200 rounded outline-none focus:border-purple-500" />
                      <input type="text" placeholder="NIP" value={member.nip} onChange={e => handleUpdateTeam(member.id, 'nip', e.target.value)} className="text-xs p-2 border border-slate-200 rounded outline-none focus:border-purple-500" />
                      <input type="text" placeholder="Pangkat" value={member.pangkat} onChange={e => handleUpdateTeam(member.id, 'pangkat', e.target.value)} className="text-xs p-2 border border-slate-200 rounded outline-none focus:border-purple-500" />
                      <input type="text" placeholder="Jabatan" value={member.jabatan} onChange={e => handleUpdateTeam(member.id, 'jabatan', e.target.value)} className="text-xs p-2 border border-slate-200 rounded outline-none focus:border-purple-500" />
                    </div>
                  ))}
                  {teamList.length === 0 && <div className="text-xs text-center text-slate-400 py-4">Tidak ada anggota tim</div>}
                  
                  <button
                    onClick={handleAddTeam}
                    className="w-full mt-2 py-2 border-2 border-dashed border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-500 hover:text-purple-600 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Tambah Personil
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
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition-all active:scale-95"
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
