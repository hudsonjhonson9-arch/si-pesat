import React, { useState, useMemo, useEffect } from 'react';
import { X, Printer, FileText, Trash2, Plus } from 'lucide-react';
import { OpdAudit, UserProfile } from '../types';
import { escapeHtml } from '../lib/escape';
import html2pdf from 'html2pdf.js';
import SearchableSelect from './SearchableSelect';

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
  
  const auditName = activeCategory?.name || 'Audit Ketaatan';
  const [maksud, setMaksud] = useState(`Melakukan ${auditName}`);
  const [tempatTujuan, setTempatTujuan] = useState(audit.opdName);
  const [lamanya, setLamanya] = useState('Selama 8 (delapan) hari');
  const [tglBerangkat, setTglBerangkat] = useState('11 Mei 2026');
  const [tglKembali, setTglKembali] = useState('25 Mei 2026');
  
  const [inspekturNama, setInspekturNama] = useState('');
  const [inspekturNip, setInspekturNip] = useState('');
  const [inspekturPangkat, setInspekturPangkat] = useState('PEMBINA TINGKAT I – IV/b');

  const sortedUserOptions = useMemo(() => {
    return [...(userProfiles || [])]
      .sort((a, b) => {
        const golA = a.golongan || '';
        const golB = b.golongan || '';
        if (golA > golB) return -1;
        if (golA < golB) return 1;
        const nameA = (a.full_name || a.email || '').toLowerCase();
        const nameB = (b.full_name || b.email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      })
      .map(p => ({
        value: p.id,
        label: p.full_name || p.email || 'Tanpa Nama'
      }));
  }, [userProfiles]);

  useEffect(() => {
    if (userProfiles && !inspekturNama && !inspekturNip) {
      const inspektur = userProfiles.find(p => p.role?.toLowerCase() === 'inspektur' || p.full_name?.toLowerCase().includes('inspektur'));
      if (inspektur) {
        setInspekturNama(inspektur.full_name || inspektur.email || '');
        if (inspektur.nip) setInspekturNip(inspektur.nip);
        if (inspektur.pangkat && inspektur.golongan) setInspekturPangkat(`${inspektur.pangkat} – ${inspektur.golongan}`);
        else if (inspektur.pangkat) setInspekturPangkat(inspektur.pangkat);
      }
    }
  }, [userProfiles]);
  
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
    const profile = userProfiles.find(p => p.full_name?.toLowerCase() === name.toLowerCase() || p.email?.toLowerCase() === name.toLowerCase());
    return {
      id: Math.random().toString(),
      nama: name,
      nip: profile?.nip || '-',
      pangkat: 'Penata Muda – III/a',
      jabatan: idx === 0 ? 'Ketua Tim' : 'Anggota Tim',
      nomorSurat: '425 / SPPD / 2026'
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
        jabatan: 'Anggota Tim',
        nomorSurat: '425 / SPPD / 2026'
      }
    ]);
  };

  const handleRemoveTeam = (id: string) => {
    setTeamList(prev => prev.filter(t => t.id !== id));
  };

  const htmlContent = useMemo(() => {
    const pages = teamList.map((member, idx) => `
      <div class="pdf-page" style="width: 210mm; min-height: 297mm; padding: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm; box-sizing: border-box; background-color: white; background-image: linear-gradient(to bottom, transparent 296mm, #94a3b8 296mm, #94a3b8 297mm); background-size: 100% 297mm; box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-family: 'Times New Roman', Times, serif; color: #000000; font-size: 11pt; line-height: 1.3; position: relative; ${idx > 0 ? 'page-break-before: always;' : ''}">
        
        <!-- KOP SURAT -->
        <table style="width: 100%;">
          <tr>
            <td style="width: 90px; text-align: center; vertical-align: middle;">
              <img src="https://raw.githubusercontent.com/hudsonjhonson9-arch/sekrebot/454f3b4b2c805ec163bf4525d82586c8944fb6c8/Lambang_Kabupaten_Sumba_Barat.png" alt="Logo" style="width: 80px; height: auto;" />
            </td>
            <td style="text-align: center; vertical-align: middle;">
              <div style="font-size: 14pt; font-weight: bold; margin-bottom: 5px; white-space: nowrap;">${escapeHtml(instansi)}</div>
              <div style="font-size: 18pt; font-weight: bold; margin-bottom: 5px; letter-spacing: 2px; white-space: nowrap;">${escapeHtml(lembaga)}</div>
              <div style="font-size: 10pt; line-height: 1.2;">${escapeHtml(alamat)}</div>
            </td>
            <td style="width: 90px;"></td> <!-- Dummy cell for centering -->
          </tr>
        </table>
        <div style="border-bottom: 3px solid black; margin-top: 15px; margin-bottom: 25px;"></div>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
          <table style="width: 300px;">
            <tr><td style="width: 80px;">Lembar Ke</td><td style="width: 10px;">:</td><td></td></tr>
            <tr><td>Kode No.</td><td>:</td><td></td></tr>
            <tr><td>Nomor</td><td>:</td><td>${escapeHtml(member.nomorSurat)}</td></tr>
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
              ${escapeHtml(member.nama)} /<br/>${escapeHtml(member.nip)}
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
              a. ${escapeHtml(member.pangkat)}<br/>
              b. ${escapeHtml(member.jabatan)}<br/>
              c. 
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">4</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">Maksud Perjalanan Dinas</td>
            <td style="border: 1px solid black; padding: 6px; vertical-align: top;">${escapeHtml(maksud)}</td>
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
              b. ${escapeHtml(tempatTujuan)}
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
              a. ${escapeHtml(lamanya)}<br/>
              b. ${escapeHtml(tglBerangkat)}<br/>
              c. ${escapeHtml(tglKembali)}
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
        <div class="avoid-break" style="width: 100%; page-break-inside: avoid;">
          <div style="margin-left: auto; width: 300px;">
            <table style="width: 100%; margin-bottom: 15px;">
              <tr><td style="width: 100px;">Dikeluarkan di</td><td style="width: 10px;">:</td><td>Waikabubak</td></tr>
              <tr><td>Pada Tanggal</td><td>:</td><td>..............................</td></tr>
            </table>
            
            <div style="text-align: center;">
              <div>INSPEKTUR KABUPATEN SUMBA BARAT,</div>
              <div style="height: 80px;"></div>
              <div style="font-weight: bold; text-decoration: underline;">${escapeHtml(inspekturNama)}</div>
              <div>${escapeHtml(inspekturPangkat)}</div>
              <div>NIP. ${escapeHtml(inspekturNip)}</div>
            </div>
          </div>
        </div>

      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak SPPD - ${escapeHtml(audit.opdName)}</title>
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
              box-shadow: none !important;
              background-image: none !important;
            }
            #page-wrapper { padding: 0 !important; gap: 0 !important; }
          }
        </style>
      </head>
      <body>
        <div id="clip-container" style="width: 100vw; overflow: hidden; background: #525659; position: relative;">
          <div id="page-wrapper" style="transform-origin: top center; background: transparent; padding: 20px 0; display: flex; flex-direction: column; gap: 20px; align-items: center;">
            ${pages}
          </div>
        </div>
        <script>
          function adjustScale() {
            var wrapper = document.getElementById('page-wrapper');
            var clipContainer = document.getElementById('clip-container');
            var containerWidth = window.innerWidth;
            var scale = 1;
            if (containerWidth < 834) { // 794 (A4 width) + 40 (padding)
              scale = containerWidth / 834;
            }
            wrapper.style.transform = 'scale(' + scale + ')';
            var rect = wrapper.getBoundingClientRect();
            clipContainer.style.height = (rect.height + 40) + 'px';
          }
          
          function applyLivePagination() {
            if (window.location.href === 'about:blank') return; // Do not run in print window
            
            var pages = document.querySelectorAll('.pdf-page');
            if (!pages.length) return;
            
            setTimeout(function() {
              var div = document.createElement('div');
              div.style.height = '297mm';
              document.body.appendChild(div);
              var a4HeightPx = div.offsetHeight;
              document.body.removeChild(div);
              
              var divMargin = document.createElement('div');
              divMargin.style.height = '${marginTop}mm';
              document.body.appendChild(divMargin);
              var topMarginPx = divMargin.offsetHeight;
              document.body.removeChild(divMargin);
              
              pages.forEach(function(content) {
                var avoidElements = content.querySelectorAll('.avoid-break');
                avoidElements.forEach(function(el) { el.style.paddingTop = '0px'; });
                
                avoidElements.forEach(function(el) {
                  // Find offset relative to the pdf-page container
                  var topInContent = el.offsetTop;
                  var bottomInContent = topInContent + el.offsetHeight;
                  
                  var pageIndexTop = Math.floor(topInContent / a4HeightPx);
                  var pageIndexBottom = Math.floor(bottomInContent / a4HeightPx);
                  
                  if (pageIndexTop !== pageIndexBottom) {
                    var pushAmount = ((pageIndexTop + 1) * a4HeightPx) + topMarginPx - topInContent;
                    el.style.paddingTop = pushAmount + 'px';
                  }
                });
              });
              adjustScale();
            }, 50);
          }
          
          window.addEventListener('resize', adjustScale);
          adjustScale();
          applyLivePagination();
          window.onafterprint = function() { window.close(); };
        </script>
      </body>
      </html>
    `;
  }, [instansi, lembaga, alamat, maksud, tempatTujuan, lamanya, tglBerangkat, tglKembali, teamList, inspekturNama, inspekturNip, marginTop, marginBottom, marginLeft, marginRight]);

  const handleDownloadPdf = () => {
    if (!maksud.trim() || !tempatTujuan.trim() || !lamanya.trim() || !tglBerangkat.trim() || !tglKembali.trim() || !inspekturNama.trim() || !inspekturNip.trim()) {
      alert('Mohon lengkapi semua isian (Maksud, Tempat Tujuan, Lama, Tanggal, Nama & NIP Inspektur)!');
      return;
    }
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

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Isi Cepat dari Daftar User</label>
                  <SearchableSelect
                    options={sortedUserOptions}
                    placeholder="-- Pilih user untuk mengisi Nama & NIP --"
                    onChange={(val) => {
                      const profile = userProfiles?.find(p => p.id === val);
                      if (profile) {
                        setInspekturNama(profile.full_name || profile.email || '');
                        if (profile.nip) setInspekturNip(profile.nip);
                        if (profile.pangkat && profile.golongan) setInspekturPangkat(`${profile.pangkat} – ${profile.golongan}`);
                        else if (profile.pangkat) setInspekturPangkat(profile.pangkat);
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Inspektur</label>
                  <input type="text" value={inspekturNama} onChange={e => setInspekturNama(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">NIP Inspektur</label>
                  <input type="text" value={inspekturNip} onChange={e => setInspekturNip(e.target.value)} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
                </div>
              </div>

              <details className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <summary className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100 flex items-center justify-between">
                  Pengaturan Margin (mm)
                </summary>
                <div className="p-4 grid grid-cols-2 gap-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Atas</label>
                    <input type="number" value={marginTop} onChange={e => setMarginTop(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bawah</label>
                    <input type="number" value={marginBottom} onChange={e => setMarginBottom(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kiri</label>
                    <input type="number" value={marginLeft} onChange={e => setMarginLeft(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kanan</label>
                    <input type="number" value={marginRight} onChange={e => setMarginRight(Number(e.target.value))} className="w-full text-xs font-medium border border-slate-200 p-2.5 rounded-lg bg-white outline-none focus:border-purple-500" />
                  </div>
                </div>
              </details>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Data Anggota Tim (Akan dicetak {teamList.length} halaman)</label>
                <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200">
                  {teamList.map((member, i) => (
                    <div key={member.id} className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="col-span-2 flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">Anggota Tim {i + 1}</span>
                        <button onClick={() => handleRemoveTeam(member.id)} className="text-red-400 hover:text-red-600 transition-colors p-1" title="Hapus Anggota Tim">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="col-span-2 mb-1">
                        <SearchableSelect
                          options={sortedUserOptions}
                          placeholder="-- Pilih dari daftar user --"
                          onChange={(val) => {
                            const profile = userProfiles.find(p => p.id === val);
                            if (profile) {
                              const profileName = profile.full_name || profile.email || '';
                              const exists = teamList.some(t => t.id !== member.id && t.nama.toLowerCase() === profileName.toLowerCase());
                              if (exists) {
                                alert('Anggota ini sudah ada dalam tim!');
                                return;
                              }
                              handleUpdateTeam(member.id, 'nama', profileName);
                              handleUpdateTeam(member.id, 'nip', profile.nip || '-');
                            }
                          }}
                        />
                      </div>

                      <input type="text" placeholder="Nama" value={member.nama} onChange={e => handleUpdateTeam(member.id, 'nama', e.target.value)} className="text-xs p-2 border border-slate-200 rounded outline-none focus:border-purple-500" />
                      <input type="text" placeholder="NIP" value={member.nip} onChange={e => handleUpdateTeam(member.id, 'nip', e.target.value)} className="text-xs p-2 border border-slate-200 rounded outline-none focus:border-purple-500" />
                      <input type="text" placeholder="Pangkat" value={member.pangkat} onChange={e => handleUpdateTeam(member.id, 'pangkat', e.target.value)} className="text-xs p-2 border border-slate-200 rounded outline-none focus:border-purple-500" />
                      <input type="text" placeholder="Jabatan" value={member.jabatan} onChange={e => handleUpdateTeam(member.id, 'jabatan', e.target.value)} className="text-xs p-2 border border-slate-200 rounded outline-none focus:border-purple-500" />
                      <div className="col-span-2">
                        <input type="text" placeholder="Nomor Surat" value={member.nomorSurat} onChange={e => handleUpdateTeam(member.id, 'nomorSurat', e.target.value)} className="w-full text-xs p-2 border border-slate-200 rounded outline-none focus:border-purple-500" />
                      </div>
                    </div>
                  ))}
                  {teamList.length === 0 && <div className="text-xs text-center text-slate-400 py-4">Tidak ada anggota tim</div>}
                  
                  <button
                    onClick={handleAddTeam}
                    className="w-full mt-2 py-2 border-2 border-dashed border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-500 hover:text-purple-600 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
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
