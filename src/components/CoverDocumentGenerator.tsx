import React, { useState } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { OpdAudit } from '../types';

interface CoverDocumentGeneratorProps {
  audit: OpdAudit;
  onClose: () => void;
}

export default function CoverDocumentGenerator({ audit, onClose }: CoverDocumentGeneratorProps) {
  const [instansi, setInstansi] = useState('PEMERINTAH KABUPATEN SUMBA BARAT');
  const [lembaga, setLembaga] = useState('INSPEKTORAT');
  const [alamat, setAlamat] = useState('Jl. Basuki Rahmat Kampung Sawah Kota Waikabubak\nTelp. (0387) 21165 – Email: inspektorat_kabsumbabarat@yahoo.com');
  const [judul1, setJudul1] = useState('KERTAS KERJA PEMERIKSAAN (KKP)');
  const [judul2, setJudul2] = useState('PEMERIKSAAN REGULER');
  
  const [pada, setPada] = useState(audit.opdName.toUpperCase());
  const [kecamatan, setKecamatan] = useState('LOLI');
  const [kabupaten, setKabupaten] = useState('SUMBA BARAT PROVINSI NUSA TENGGARA TIMUR');
  
  // Create a default date range string from audit.fiscalYear or just static
  const [tanggal, setTanggal] = useState('25 Agustus 2025 s/d 8 September 2025 (10 HARI KERJA)');
  
  // Combine auditorName (Ketua) and teamMembers (Anggota)
  const defaultTeam = [
    audit.auditorName || 'Nama Ketua Tim',
    ...(audit.teamMembers || [])
  ].map(name => name.toUpperCase());
  
  const [timPemeriksa, setTimPemeriksa] = useState<string>(defaultTeam.join('\n'));

  const handlePrint = () => {
    const teamListHTML = timPemeriksa.split('\n').map((name, i) => `
      <tr>
        <td style="width: 20px; vertical-align: top;">${i + 1}.</td>
        <td style="vertical-align: top;">${name}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Sampul KKP - ${pada}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 2.5cm;
            }
            body {
              -webkit-print-color-adjust: exact;
            }
          }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 14pt;
            line-height: 1.3;
            margin: 0;
            padding: 0;
            color: black;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .header-instansi { font-size: 14pt; font-weight: bold; margin-bottom: 5px; }
          .header-lembaga { font-size: 18pt; font-weight: bold; margin-bottom: 15px; }
          .header-alamat { font-size: 11pt; margin-bottom: 40px; }
          
          .judul { font-size: 13pt; font-weight: bold; margin-bottom: 10px; }
          
          .center-lines {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 60px 0;
            height: 150px;
          }
          .line-short {
            width: 2px;
            background-color: black;
            height: 100px;
            margin-top: 25px;
          }
          .line-long {
            width: 2px;
            background-color: black;
            height: 150px;
          }
          
          .info-table {
            width: 100%;
            margin-top: 40px;
            border-collapse: collapse;
          }
          .info-table td {
            padding: 5px 0;
            vertical-align: top;
          }
          .col-label { width: 180px; }
          .col-colon { width: 20px; }
          
          .team-table {
            border-collapse: collapse;
            width: 100%;
          }
          .team-table td {
            padding: 2px 0;
          }
        </style>
      </head>
      <body>
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
          <tr>
            <td class="col-label">PADA</td>
            <td class="col-colon">:</td>
            <td>${pada}</td>
          </tr>
          <tr>
            <td class="col-label">KECAMATAN</td>
            <td class="col-colon">:</td>
            <td>${kecamatan}</td>
          </tr>
          <tr>
            <td class="col-label">KABUPATEN</td>
            <td class="col-colon">:</td>
            <td>${kabupaten}</td>
          </tr>
          <tr>
            <td class="col-label">TANGGAL</td>
            <td class="col-colon">:</td>
            <td>${tanggal}</td>
          </tr>
          <tr>
            <td class="col-label">TIM PEMERIKSA</td>
            <td class="col-colon">:</td>
            <td>
              <table class="team-table">
                ${teamListHTML}
              </table>
            </td>
          </tr>
        </table>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      alert("Gagal membuka jendela cetak. Mohon izinkan pop-up untuk situs ini.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-gray/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-dark-gray/10 bg-slate-50">
          <div className="flex items-center gap-2 text-dark-gray">
            <FileText className="w-5 h-5 text-peach-accent" />
            <h2 className="font-black text-sm tracking-wide uppercase">Cetak Sampul Dokumen</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark-gray/10 text-dark-gray/60 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
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

            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Tim Pemeriksa (1 Baris = 1 Nama)</label>
              <textarea 
                value={timPemeriksa} 
                onChange={e => setTimPemeriksa(e.target.value)} 
                rows={5}
                className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded bg-white text-dark-gray outline-none focus:border-peach-accent" 
              />
              <p className="text-[9px] text-dark-gray/50 font-bold">Baris pertama adalah Ketua Tim, baris selanjutnya adalah Anggota.</p>
            </div>
            
            {/* Header Configuration Toggle */}
            <details className="col-span-2 mt-4 bg-slate-50 p-3 rounded border border-dark-gray/10 group cursor-pointer">
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

        <div className="p-4 border-t border-dark-gray/10 bg-white flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-dark-gray font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
            Batal
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2 bg-peach-accent text-dark-gray font-black text-xs rounded-lg border border-dark-gray/10 hover:opacity-90 transition-opacity cursor-pointer shadow-sm">
            <Printer className="w-3.5 h-3.5" />
            Cetak PDF
          </button>
        </div>
      </div>
    </div>
  );
}
