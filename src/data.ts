/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KKATemplate, OpdAudit } from './types';

export const DEFAULT_KKA_TEMPLATE: KKATemplate = {
  id: 'template_bos_nasional',
  name: 'KKA Standar Dana BOS Nasional (Inspektorat)',
  isDefault: true,
  categories: [
    {
      id: 'cat_rkas',
      name: 'I. Perencanaan & Penganggaran (RKAS)',
      description: 'Pengujian keselarasan penganggaran OPD dengan regulasi juknis BOS.',
      items: [
        {
          id: 'item_rkas_1',
          title: 'Kesesuaian RKAS dengan Juknis BOS',
          description: 'Apakah program kegiatan dalam RKAS sepenuhnya mengacu pada prioritas belanja dalam Juknis BOS yang berlaku?'
        },
        {
          id: 'item_rkas_2',
          title: 'Keterlibatan Komite & Stakeholder',
          description: 'Apakah penyusunan RKAS melibatkan Dewan Guru, Tenaga Kependidikan, dan Komite OPD dibuktikan dengan Berita Acara?'
        },
        {
          id: 'item_rkas_3',
          title: 'Kesesuaian Target Output RKAS',
          description: 'Apakah rancangan anggaran logis dibanding target kinerja output sarana OPD?'
        }
      ]
    },
    {
      id: 'cat_pbj',
      name: 'II. Pengadaan Barang & Jasa (PBJ) OPD',
      description: 'Pengujian keabsahan bukti pengadaan melalui SIPLah, pajak, dan harga pasar.',
      items: [
        {
          id: 'item_pbj_1',
          title: 'Ketaatan Penggunaan SIPLah',
          description: 'Apakah belanja barang, jasa, dan modal dengan nilai tertentu telah dilakukan secara tertib melalui portal SIPLah?'
        },
        {
          id: 'item_pbj_2',
          title: 'Keabsahan Bukti Spj Pengadaan',
          description: 'Apakah kuitansi, nota, faktur, BAST, dan dokumentasi foto kegiatan pengadaan lengkap, valid, dan bebas benturan kepentingan?'
        },
        {
          id: 'item_pbj_3',
          title: 'Kesesuaian Harga Satuan (Kemahalan Harga)',
          description: 'Apakah harga beli barang/jasa melebihi Standar Satuan Harga Pasar (SSH) daerah atau ada indikasi markup?'
        },
        {
          id: 'item_pbj_4',
          title: 'Kewajiban Perpajakan Belanja',
          description: 'Apakah PPN, PPh Pasal 21, PPh Pasal 22 atau Pasal 23 atas transaksi belanja dinilai, dipotong, dan disetorkan ke kas negara?'
        }
      ]
    },
    {
      id: 'cat_honor',
      name: 'III. Belanja Honorarium & Jasa Personil',
      description: 'Verifikasi kelayakan pembayaran honorarium guru dan tenaga kependidikan non-ASN.',
      items: [
        {
          id: 'item_honor_1',
          title: 'Kelayakan Administrasi Penerima Honor',
          description: 'Apakah penerima honor non-ASN memenuhi syarat keaktifan, memiliki NUPTK/Dapodik, dan SK pengangkatan Kepala Dinas/Kepala OPD?'
        },
        {
          id: 'item_honor_2',
          title: 'Kesesuaian Nominal Honorarium',
          description: 'Apakah besaran honorarium yang ditransfer sesuai dengan SK Tarif, daftar presensi kehadiran bulanan, dan tidak melebihi batas regulasi juknis?'
        }
      ]
    },
    {
      id: 'cat_kas',
      name: 'IV. Pengelolaan Kas & Pelaporan Keuangan',
      description: 'Pemeriksaan rekonsiliasi Buku Kas Umum, saldo fisik kas, dan ketepatan waktu pelaporan.',
      items: [
        {
          id: 'item_kas_1',
          title: 'Rekonsiliasi Buku Kas Umum & Buku Bank',
          description: 'Apakah entri Buku Kas Umum (BKU), Buku Pembantu Kas, Buku Bank, dan Buku Pajak selaras dan ditutup setiap bulan?'
        },
        {
          id: 'item_kas_2',
          title: 'Pemeriksaan Kas Fisik (Cash Opname)',
          description: 'Apakah saldo kas tunai fisik di brankas bendahara sesuai dengan sisa saldo kas di Buku Kas Umum saat pemeriksaan mendadak?'
        },
        {
          id: 'item_kas_3',
          title: 'Ketepatan Waktu Pelaporan BOS',
          description: 'Apakah pelaporan realisasi penggunaan dana BOS dilaporkan tepat waktu pada sistem Kemendikbudristek?'
        }
      ]
    },
    {
      id: 'cat_aset',
      name: 'V. Inventarisasi & Aset Tetap BOS',
      description: 'Pemeriksaan pencatatan barang modal bos ke KIB dan audit fisik keberadaan aset.',
      items: [
        {
          id: 'item_aset_1',
          title: 'Pencatatan pada Kartu Inventaris Barang (KIB)',
          description: 'Apakah semua pembelian barang modal (laptop, proyektor, buku perpustakaan) segera dicatatkan ke KIB (KIB B/E) sebagai aset daerah?'
        },
        {
          id: 'item_aset_2',
          title: 'Pemberian Label Registrasi Aset',
          description: 'Apakah barang inventaris dana BOS telah ditempeli label registrasi barang milik daerah secara permanen?'
        },
        {
          id: 'item_aset_3',
          title: 'Uji Keberadaan Fisik Aset (Eksistensi)',
          description: 'Apakah fisik laptop, komputer, atau alat digital yang dibeli dari dana BOS berada di tempat tugas dalam kondisi baik/bisa digunakan?'
        }
      ]
    }
  ]
};

export const INITIAL_OPD_AUDITS: OpdAudit[] = [
  {
    id: 'audit_sdn_01_menteng',
    opdName: 'SDN 01 Menteng',
    opdType: 'SD',
    fiscalYear: '2025',
    auditorName: 'Drs. Hermawan, M.Si (Ketua Tim)',
    auditDate: '2026-03-12',
    budget: 450000000,
    status: '', progress: 0,
    categories: [
      {
        id: 'cat_rkas',
        name: 'I. Perencanaan & Penganggaran (RKAS)',
        description: 'Pengujian keselarasan penganggaran OPD dengan regulasi juknis BOS.',
        items: [
          {
            id: 'item_rkas_1',
            title: 'Kesesuaian RKAS dengan Juknis BOS',
            description: 'Apakah program kegiatan dalam RKAS sepenuhnya mengacu pada prioritas belanja dalam Juknis BOS yang berlaku?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_rkas_2',
            title: 'Keterlibatan Komite & Stakeholder',
            description: 'Apakah penyusunan RKAS melibatkan Dewan Guru, Tenaga Kependidikan, dan Komite OPD dibuktikan dengan Berita Acara?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_rkas_3',
            title: 'Kesesuaian Target Output RKAS',
            description: 'Apakah rancangan anggaran logis dibanding target kinerja output sarana OPD?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          }
        ]
      },
      {
        id: 'cat_pbj',
        name: 'II. Pengadaan Barang & Jasa (PBJ) OPD',
        description: 'Pengujian keabsahan bukti pengadaan melalui SIPLah, pajak, dan harga pasar.',
        items: [
          {
            id: 'item_pbj_1',
            title: 'Ketaatan Penggunaan SIPLah',
            description: 'Apakah belanja barang, jasa, dan modal dengan nilai tertentu telah dilakukan secara tertib melalui portal SIPLah?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_pbj_2',
            title: 'Keabsahan Bukti Spj Pengadaan',
            description: 'Apakah kuitansi, nota, faktur, BAST, dan dokumentasi foto kegiatan pengadaan lengkap, valid, dan bebas benturan kepentingan?',
            status: '', progress: 0,
            nilaiTemuan: 12500000,
            jenisTemuan: 'Belanja Fiktif',
            uraianTemuan: 'Ditemukan pertanggungjawaban belanja pemeliharaan gedung OPD sebesar Rp 12.500.000 dengan kuitansi toko bangunan fiktif dan foto pengerjaan hasil manipulasi.',
            rekomendasi: 'Kepala OPD agar memerintahkan Bendahara BOS menyetorkan kembali sisa uang sebesar Rp 12.500.000 ke rekening Kas Daerah/Rekening BOS OPD dan memberikan sanksi administratif kepada bendahara.'
          },
          {
            id: 'item_pbj_3',
            title: 'Kesesuaian Harga Satuan (Kemahalan Harga)',
            description: 'Apakah harga beli barang/jasa melebihi Standar Satuan Harga Pasar (SSH) daerah atau ada indikasi markup?',
            status: '', progress: 0,
            nilaiTemuan: 4500000,
            jenisTemuan: 'Kelebihan Pembayaran',
            uraianTemuan: 'Pembelian 5 unit printer bermerek melalui koperasi OPD terindikasi markup harga sebesar Rp 900.000 per unit dari harga eceran standar daerah, total kerlebihan harga Rp 4.500.000.',
            rekomendasi: 'Mengembalikan kelebihan pembayaran sebesar Rp 4.500.000 ke Kas OPD.'
          },
          {
            id: 'item_pbj_4',
            title: 'Kewajiban Perpajakan Belanja',
            description: 'Apakah PPN, PPh Pasal 21, PPh Pasal 22 atau Pasal 23 atas transaksi belanja dinilai, dipotong, dan disetorkan ke kas negara?',
            status: '', progress: 0,
            nilaiTemuan: 1850000,
            jenisTemuan: 'Pajak Belum Disetor',
            uraianTemuan: 'Pajak PPN dan PPh Pasal 22 atas belanja modal laptop senilai Rp 18.500.000 belum dipungut dan belum disetorkan oleh Bendahara BOS ke Kas Negara sebesar Rp 1.850.000.',
            rekomendasi: 'Segera melakukan penyetoran pajak terutang sebesar Rp 1.850.000 ke Kantor Pelayanan Pajak Pratama setempat mengunakan SSP dan melaporkan buktinya.'
          }
        ]
      },
      {
        id: 'cat_honor',
        name: 'III. Belanja Honorarium & Jasa Personil',
        description: 'Verifikasi kelayakan pembayaran honorarium guru dan tenaga kependidikan non-ASN.',
        items: [
          {
            id: 'item_honor_1',
            title: 'Kelayakan Administrasi Penerima Honor',
            description: 'Apakah penerima honor non-ASN memenuhi syarat keaktifan, memiliki NUPTK/Dapodik, dan SK pengangkatan Kepala Dinas/Kepala OPD?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_honor_2',
            title: 'Kesesuaian Nominal Honorarium',
            description: 'Apakah besaran honorarium yang ditransfer sesuai dengan SK Tarif, daftar presensi kehadiran bulanan, dan tidak melebihi batas regulasi juknis?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          }
        ]
      },
      {
        id: 'cat_kas',
        name: 'IV. Pengelolaan Kas & Pelaporan Keuangan',
        description: 'Pemeriksaan rekonsiliasi Buku Kas Umum, saldo fisik kas, dan ketepatan waktu pelaporan.',
        items: [
          {
            id: 'item_kas_1',
            title: 'Rekonsiliasi Buku Kas Umum & Buku Bank',
            description: 'Apakah entri Buku Kas Umum (BKU), Buku Pembantu Kas, Buku Bank, dan Buku Pajak selaras dan ditutup setiap bulan?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_kas_2',
            title: 'Pemeriksaan Kas Fisik (Cash Opname)',
            description: 'Apakah saldo kas tunai fisik di brankas bendahara sesuai dengan sisa saldo kas di Buku Kas Umum saat pemeriksaan mendadak?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_kas_3',
            title: 'Ketepatan Waktu Pelaporan BOS',
            description: 'Apakah pelaporan realisasi penggunaan dana BOS dilaporkan tepat waktu pada sistem Kemendikbudristek?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          }
        ]
      },
      {
        id: 'cat_aset',
        name: 'V. Inventarisasi & Aset Tetap BOS',
        description: 'Pemeriksaan pencatatan barang modal bos ke KIB dan audit fisik keberadaan aset.',
        items: [
          {
            id: 'item_aset_1',
            title: 'Pencatatan pada Kartu Inventaris Barang (KIB)',
            description: 'Apakah semua pembelian barang modal (laptop, proyektor, buku perpustakaan) segera dicatatkan ke KIB (KIB B/E) sebagai aset daerah?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_aset_2',
            title: 'Pemberian Label Registrasi Aset',
            description: 'Apakah barang inventaris dana BOS telah ditempeli label registrasi barang milik daerah secara permanen?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_aset_3',
            title: 'Uji Keberadaan Fisik Aset (Eksistensi)',
            description: 'Apakah fisik laptop, komputer, atau alat digital yang dibeli dari dana BOS berada di tempat tugas dalam kondisi baik/bisa digunakan?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          }
        ]
      }
    ]
  },
  {
    id: 'audit_smpn_3_bandung',
    opdName: 'SMPN 3 Bandung',
    opdType: 'SMP',
    fiscalYear: '2025',
    auditorName: 'Budi Santoso, SE, Ak. (Ketua Tim)',
    auditDate: '2026-04-05',
    budget: 850000000,
    status: '', progress: 0,
    categories: [
      {
        id: 'cat_rkas',
        name: 'I. Perencanaan & Penganggaran (RKAS)',
        description: 'Pengujian keselarasan penganggaran OPD dengan regulasi juknis BOS.',
        items: [
          {
            id: 'item_rkas_1',
            title: 'Kesesuaian RKAS dengan Juknis BOS',
            description: 'Apakah program kegiatan dalam RKAS sepenuhnya mengacu pada prioritas belanja dalam Juknis BOS yang berlaku?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_rkas_2',
            title: 'Keterlibatan Komite & Stakeholder',
            description: 'Apakah penyusunan RKAS melibatkan Dewan Guru, Tenaga Kependidikan, dan Komite OPD dibuktikan dengan Berita Acara?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_rkas_3',
            title: 'Kesesuaian Target Output RKAS',
            description: 'Apakah rancangan anggaran logis dibanding target kinerja output sarana OPD?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          }
        ]
      },
      {
        id: 'cat_pbj',
        name: 'II. Pengadaan Barang & Jasa (PBJ) OPD',
        description: 'Pengujian keabsahan bukti pengadaan melalui SIPLah, pajak, dan harga pasar.',
        items: [
          {
            id: 'item_pbj_1',
            title: 'Ketaatan Penggunaan SIPLah',
            description: 'Apakah belanja barang, jasa, dan modal dengan nilai tertentu telah dilakukan secara tertib melalui portal SIPLah?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_pbj_2',
            title: 'Keabsahan Bukti Spj Pengadaan',
            description: 'Apakah kuitansi, nota, faktur, BAST, dan dokumentasi foto kegiatan pengadaan lengkap, valid, dan bebas benturan kepentingan?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_pbj_3',
            title: 'Kesesuaian Harga Satuan (Kemahalan Harga)',
            description: 'Apakah harga beli barang/jasa melebihi Standar Satuan Harga Pasar (SSH) daerah atau ada indikasi markup?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_pbj_4',
            title: 'Kewajiban Perpajakan Belanja',
            description: 'Apakah PPN, PPh Pasal 21, PPh Pasal 22 atau Pasal 23 atas transaksi belanja dinilai, dipotong, dan disetorkan ke kas negara?',
            status: '', progress: 0,
            nilaiTemuan: 3400000,
            jenisTemuan: 'Pajak Belum Disetor',
            uraianTemuan: 'Pemberian jasa konsultan analisis IT OPD senilai Rp 34.000.000 belum dipungut potongan pajak PPh Pasal 23 sebesar 10% (Rp 3.400.000) hingga audit ini berjalan.',
            rekomendasi: 'Membuat STP (Surat Tagihan Pajak) dan memerintahkan rekanan/bendahara melakukan kliring tagihan perpajakan.'
          }
        ]
      },
      {
        id: 'cat_honor',
        name: 'III. Belanja Honorarium & Jasa Personil',
        description: 'Verifikasi kelayakan pembayaran honorarium guru dan tenaga kependidikan non-ASN.',
        items: [
          {
            id: 'item_honor_1',
            title: 'Kelayakan Administrasi Penerima Honor',
            description: 'Apakah penerima honor non-ASN memenuhi syarat keaktifan, memiliki NUPTK/Dapodik, dan SK pengangkatan Kepala Dinas/Kepala OPD?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_honor_2',
            title: 'Kesesuaian Nominal Honorarium',
            description: 'Apakah besaran honorarium yang ditransfer sesuai dengan SK Tarif, daftar presensi kehadiran bulanan, dan tidak melebihi batas regulasi juknis?',
            status: '', progress: 0,
            nilaiTemuan: 8400000,
            jenisTemuan: 'Tidak Sesuai Juknis',
            uraianTemuan: 'Ditemukan dana BOS digunakan untuk membayar honor tambahan guru berstatus ASN/PNS aktif sebesar Rp 1.200.000 per bulan selama 7 bulan (total Rp 8.400.000), bertentangan dengan juknis pelarangan honorarium ganda bagi ASN.',
            rekomendasi: 'Menyetorkan kembali dana Rp 8.400.000 ke bank kas OPD dan mereposisi pos anggaran honor bagi guru non-ASN.'
          }
        ]
      },
      {
        id: 'cat_kas',
        name: 'IV. Pengelolaan Kas & Pelaporan Keuangan',
        description: 'Pemeriksaan rekonsiliasi Buku Kas Umum, saldo fisik kas, dan ketepatan waktu pelaporan.',
        items: [
          {
            id: 'item_kas_1',
            title: 'Rekonsiliasi Buku Kas Umum & Buku Bank',
            description: 'Apakah entri Buku Kas Umum (BKU), Buku Pembantu Kas, Buku Bank, dan Buku Pajak selaras dan ditutup setiap bulan?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_kas_2',
            title: 'Pemeriksaan Kas Fisik (Cash Opname)',
            description: 'Apakah saldo kas tunai fisik di brankas bendahara sesuai dengan sisa saldo kas di Buku Kas Umum saat pemeriksaan mendadak?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_kas_3',
            title: 'Ketepatan Waktu Pelaporan BOS',
            description: 'Apakah pelaporan realisasi penggunaan dana BOS dilaporkan tepat waktu pada sistem Kemendikbudristek?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          }
        ]
      },
      {
        id: 'cat_aset',
        name: 'V. Inventarisasi & Aset Tetap BOS',
        description: 'Pemeriksaan pencatatan barang modal bos ke KIB dan audit fisik keberadaan aset.',
        items: [
          {
            id: 'item_aset_1',
            title: 'Pencatatan pada Kartu Inventaris Barang (KIB)',
            description: 'Apakah semua pembelian barang modal (laptop, proyektor, buku perpustakaan) segera dicatatkan ke KIB (KIB B/E) sebagai aset daerah?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_aset_2',
            title: 'Pemberian Label Registrasi Aset',
            description: 'Apakah barang inventaris dana BOS telah ditempeli label registrasi barang milik daerah secara permanen?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          },
          {
            id: 'item_aset_3',
            title: 'Uji Keberadaan Fisik Aset (Eksistensi)',
            description: 'Apakah fisik laptop, komputer, atau alat digital yang dibeli dari dana BOS berada di tempat tugas dalam kondisi baik/bisa digunakan?',
            status: '', progress: 0,
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          }
        ]
      }
    ]
  }
];
