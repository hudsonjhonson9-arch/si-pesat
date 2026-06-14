/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { OpdAudit, AuditCategory, AuditItem, AuditStatus, FindingStatus, AuditType, UserProfile, KKATemplate } from '../types';
import { uploadEvidenceFile, copyEvidenceFileFromUrl } from '../lib/googleDrive';
import EvidencePanel from './EvidencePanel';
import { 
  ArrowLeft, 
  Save, 
  Cloud, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Check, 
  Eye, 
  Layers, 
  PlusCircle, 
  Briefcase, 
  FolderPlus,
  Compass,
  FileCheck,
  Percent,
  Download,
  CheckCircle,
  HelpCircle,
  Edit2,
  ChevronDown
} from 'lucide-react';

interface AuditWorkspaceViewProps {
  audit: OpdAudit;
  onBack: () => void;
  onUpdates: (updatedAudit: OpdAudit) => void;
  onSync: (audit: OpdAudit) => void;
  isDriveConnected: boolean;
  isSyncing: boolean;
  userRole?: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur';
  accessToken?: string | null;
  userProfiles: UserProfile[];
  templates: KKATemplate[];
}

export default function AuditWorkspaceView({
  audit,
  onBack,
  onUpdates,
  onSync,
  isDriveConnected,
  isSyncing,
  userRole = 'Auditor',
  accessToken = null,
  userProfiles = [],
  templates = []
}: AuditWorkspaceViewProps) {
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    audit.categories.length > 0 ? audit.categories[0].id : ''
  );
  
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  const [uploadingIds, setUploadingIds] = useState<Record<string, boolean>>({});

  const handleDirectUpload = async (itemId: string, file: File) => {
    setUploadingIds(prev => ({ ...prev, [itemId]: true }));
    try {
      const res = await uploadEvidenceFile(file, audit.fiscalYear, audit.opdName, audit.auditType);
      handleFindingDetailsUpdate(itemId, {
        evidenceLink: res.webViewLink,
        evidenceName: res.name
      });
      alert(`Sukses! Berkas bukti "${res.name}" berhasil diunggah langsung ke Google Drive dan tautan dokumen tersemat.`);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal mengunggah file bukti ke Google Drive: ${err.message || err}`);
    } finally {
      setUploadingIds(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const [copyingIds, setCopyingIds] = useState<Record<string, boolean>>({});

  const handleDirectCopy = async (itemId: string, sourceUrl: string, currentName: string) => {
    if (!sourceUrl || !sourceUrl.includes('drive.google.com')) return;
    setCopyingIds(prev => ({ ...prev, [itemId]: true }));
    try {
      const res = await copyEvidenceFileFromUrl(sourceUrl, currentName || `Copy_of_${itemId}`, audit.fiscalYear, audit.opdName, audit.auditType);
      handleFindingDetailsUpdate(itemId, {
        evidenceLink: res.webViewLink,
        evidenceName: res.name
      });
      alert(`Sukses! Berkas dari tautan berhasil disalin ke Drive Pusat sebagai "${res.name}".`);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyalin tautan ke Drive Pusat: ${err.message || err}`);
    } finally {
      setCopyingIds(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [selectedMasterCatId, setSelectedMasterCatId] = useState('');

  // Editing School General Information
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metaSchoolName, setMetaSchoolName] = useState(audit.opdName);
  const [metaAuditorName, setMetaAuditorName] = useState(audit.auditorName);
  const [metaStatus, setMetaStatus] = useState<AuditStatus>(audit.status);
  const [metaFiscalYear, setMetaFiscalYear] = useState(audit.fiscalYear);
  const [metaAuditType, setMetaAuditType] = useState<AuditType>(audit.auditType || 'Belum Diatur');
  const [metaTeamMembers, setMetaTeamMembers] = useState<string[]>(audit.teamMembers || []);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

  // Find the currently selected category
  const activeCategory = useMemo(() => {
    return audit.categories.find(c => c.id === selectedCategoryId);
  }, [audit.categories, selectedCategoryId]);

  const currentTemplate = useMemo(() => {
    return templates?.find(t => t.name === audit.auditType);
  }, [templates, audit.auditType]);

  const availableMasterCategories = useMemo(() => {
    if (!currentTemplate) return [];
    return currentTemplate.categories.filter(tc => !audit.categories.find(ac => ac.name === tc.name));
  }, [currentTemplate, audit.categories]);

  const isReadOnly = (userRole === 'Auditor' && (audit.status === 'Direview' || audit.status === 'Selesai')) || 
                     ((userRole === 'Inspektur Pembantu' || userRole === 'Inspektur') && audit.status === 'Selesai');
                     
  const isReviewerPanelVisible = (userRole === 'Inspektur Pembantu' || userRole === 'Inspektur') && audit.status === 'Direview';

  // Handle saving general metadata updates
  const handleSaveMetadata = () => {
    onUpdates({
      ...audit,
      opdName: metaSchoolName,
      auditorName: metaAuditorName,
      status: metaStatus,
      fiscalYear: metaFiscalYear,
      teamMembers: metaTeamMembers
    });
    setIsEditingMetadata(false);
  };

  // Quick state toggling for individual criteria items
  const handleItemStatusChange = (itemId: string, status: FindingStatus) => {
    if (isReadOnly) return;
    const updatedCategories = audit.categories.map(cat => {
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id === itemId) {
            const isNowTemuan = status === 'Temuan';
            return {
              ...item,
              status,
              // Clean finding attributes if not marked as Temuan
              nilaiTemuan: isNowTemuan ? (item.nilaiTemuan || 0) : 0,
              jenisTemuan: isNowTemuan ? (item.jenisTemuan || 'Tidak Sesuai Juknis') : undefined,
              uraianTemuan: isNowTemuan ? (item.uraianTemuan || '') : '',
              rekomendasi: isNowTemuan ? (item.rekomendasi || '') : ''
            };
          }
          return item;
        })
      };
    });

    onUpdates({
      ...audit,
      categories: updatedCategories
    });
  };

  // Update specific values under a finding (Rupiah, classification, desc, rec)
  const handleFindingDetailChange = (itemId: string, field: keyof AuditItem, value: any) => {
    if (isReadOnly && field !== 'catatanReview') return; // Reviewers can edit catatanReview when status is Direview
    const updatedCategories = audit.categories.map(cat => {
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              [field]: value
            };
          }
          return item;
        })
      };
    });

    onUpdates({
      ...audit,
      categories: updatedCategories
    });
  };

  const handleFindingDetailsUpdate = (itemId: string, updates: Partial<AuditItem>) => {
    if (isReadOnly && !('catatanReview' in updates)) return;
    const updatedCategories = audit.categories.map(cat => {
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              ...updates
            };
          }
          return item;
        })
      };
    });

    onUpdates({
      ...audit,
      categories: updatedCategories
    });
  };

  // Adding a new custom checklist criterion to the active category
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle || !selectedCategoryId) return;

    const newItem: AuditItem = {
      id: `item_custom_${Date.now()}`,
      title: newItemTitle,
      description: newItemDesc,
      status: 'N/A',
      nilaiTemuan: 0,
      uraianTemuan: '',
      rekomendasi: ''
    };

    const updatedCategories = audit.categories.map(cat => {
      if (cat.id === selectedCategoryId) {
        return {
          ...cat,
          items: [...cat.items, newItem]
        };
      }
      return cat;
    });

    onUpdates({
      ...audit,
      categories: updatedCategories
    });

    // Reset item form
    setNewItemTitle('');
    setNewItemDesc('');
    setIsAddingItem(false);
  };

  // Delete checklist item
  const handleDeleteItem = (itemId: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus kriteria pemeriksaan ini dari berkas KKA?');
    if (!confirmed) return;

    const updatedCategories = audit.categories.map(cat => {
      return {
        ...cat,
        items: cat.items.filter(item => item.id !== itemId)
      };
    });

    onUpdates({
      ...audit,
      categories: updatedCategories
    });
  };

  // Adding a whole new category dynamically (Requirement A.1)
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterCatId) return;

    const masterCat = availableMasterCategories.find(c => c.id === selectedMasterCatId);
    if (!masterCat) return;

    const newCategory: AuditCategory = {
      id: `cat_custom_${Date.now()}`,
      name: masterCat.name,
      description: masterCat.description,
      items: masterCat.items.map(item => ({
        ...item,
        id: `item_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'N/A',
        nilaiTemuan: 0,
        uraianTemuan: '',
        rekomendasi: ''
      }))
    };

    const updatedCategories = [...audit.categories, newCategory];

    onUpdates({
      ...audit,
      categories: updatedCategories
    });

    // Reset components form
    setSelectedMasterCatId('');
    setIsAddingCategory(false);
  };

  // Remove a whole category dynamically (Requirement A.1)
  const handleDeleteCategory = (catId: string) => {
    if (audit.categories.length <= 1) {
      alert('Pemeriksaan KKA harus menyisakan minimal satu kategori utama.');
      return;
    }

    const name = audit.categories.find(c => c.id === catId)?.name || '';
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus kategori "${name}" beserta seluruh kriteria di dalamnya?`);
    if (!confirmed) return;

    const updatedCategories = audit.categories.filter(c => c.id !== catId);
    
    onUpdates({
      ...audit,
      categories: updatedCategories
    });

    // Select the first remaining category
    if (selectedCategoryId === catId) {
      setSelectedCategoryId(updatedCategories[0].id);
    }
  };

  // Calculation summaries
  const categoryStats = useMemo(() => {
    let totItems = 0;
    let totSesuai = 0;
    let totTemuan = 0;
    let totNA = 0;
    let totVal = 0;

    if (activeCategory) {
      activeCategory.items.forEach(item => {
        totItems++;
        if (item.status === 'Sesuai') totSesuai++;
        else if (item.status === 'Temuan') {
          totTemuan++;
          totVal += item.nilaiTemuan || 0;
        }
        else if (item.status === 'N/A') totNA++;
      });
    }

    return { totItems, totSesuai, totTemuan, totNA, totVal };
  }, [activeCategory]);

  return (
    <div className="space-y-6 text-dark-gray" id="audit-workspace-view">
      {/* Back and Sync Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-baby-blue p-3 rounded-xl border border-dark-gray/10 shadow-xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-dark-gray hover:text-dark-gray/70 font-extrabold transition p-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </button>

        <div className="flex items-center gap-2">
          {/* Action buttons based on Role and Status */}
          {userRole === 'Auditor' && (audit.status === 'Draft' || audit.status === 'Sedang Berjalan') && (
            <button
              onClick={() => {
                const confirmed = window.confirm('Apakah Anda yakin ingin mengajukan LHP ini untuk direview oleh pimpinan?');
                if (confirmed) onUpdates({ ...audit, status: 'Direview' });
              }}
              className="text-xs px-3 py-1.5 rounded-lg font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer border bg-blue-500 text-white border-blue-600 hover:bg-blue-600 shadow-xs"
            >
              Ajukan Review
            </button>
          )}

          {isReviewerPanelVisible && (
             <>
               <button
                  onClick={() => {
                    const confirmed = window.confirm('Apakah Anda menyetujui LHP ini menjadi Selesai?');
                    if (confirmed) onUpdates({ ...audit, status: 'Selesai' });
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer border bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-xs"
               >
                 <CheckCircle className="w-4 h-4" /> Setujui LHP
               </button>
               <button
                  onClick={() => {
                    const confirmed = window.confirm('Apakah Anda ingin mengembalikan KKA ini ke Auditor untuk direvisi?');
                    if (confirmed) onUpdates({ ...audit, status: 'Sedang Berjalan' });
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer border bg-rose-500 text-white border-rose-600 hover:bg-rose-600 shadow-xs"
               >
                 <AlertTriangle className="w-4 h-4" /> Revisi Lapangan
               </button>
             </>
          )}

          {/* Real-time sync status button */}
          <button
            disabled={!isDriveConnected || isSyncing}
            onClick={() => onSync(audit)}
            className={`text-xs px-3 py-1.5 rounded-lg font-extrabold inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
              isDriveConnected 
                ? 'bg-peach-accent text-dark-gray hover:opacity-90 border-dark-gray/10 shadow-xs' 
                : 'bg-white/20 border-dark-gray/5 text-dark-gray/40 cursor-not-allowed'
            }`}
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-dark-gray" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sinkronisasi...
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                {audit.lastSyncedAt ? 'Sinkron Ulang Drive' : 'Kirim Ke Drive'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container - Responsive Layout (Category Selector on top/left, items on scroll) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: General Profile Card & Category Navigation Menu */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* General Profile Card */}
          <div className="bg-baby-blue rounded-xl border border-dark-gray/10 p-4 shadow-xs relative text-dark-gray">
            {!isEditingMetadata ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-white/40 px-2 py-0.5 rounded font-extrabold text-dark-gray uppercase">
                    Profil Auditi
                  </span>
                  {!isReadOnly && (
                    <button 
                      onClick={() => setIsEditingMetadata(true)}
                      className="p-1 text-dark-gray hover:text-dark-gray/80 rounded transition cursor-pointer"
                      title="Edit Profil"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-black text-dark-gray flex flex-wrap items-center gap-2">
                    {audit.opdName}
                    <span className="text-[10px] bg-peach-accent/30 border border-peach-accent/50 text-dark-gray px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{audit.auditType || 'Belum Diatur'}</span>
                  </h2>
                  <p className="text-xs text-dark-gray/70 mt-0.5">Jenjang {audit.opdType} • Tahun Anggaran {audit.fiscalYear}</p>
                </div>

                <div className="pt-2 border-t border-dark-gray/10 space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-dark-gray/60 font-bold">Ketua Pemeriksa:</span>
                    <span className="font-extrabold text-dark-gray truncate max-w-[150px]">{audit.auditorName}</span>
                  </div>
                  {audit.teamMembers && audit.teamMembers.length > 0 && (
                    <div className="flex flex-col">
                      <span className="text-dark-gray/60 font-bold">Anggota Tim:</span>
                      <span className="font-extrabold text-dark-gray">{audit.teamMembers.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-dark-gray/60 font-bold">Status Berkas:</span>
                    <span className="font-extrabold text-green-850">{audit.status}</span>
                  </div>
                  {audit.lastSyncedAt && (
                    <div className="pt-1.5 text-[9px] text-emerald-800 block text-center font-extrabold bg-white/40 rounded p-1 border border-emerald-800/10">
                      Disinkronisasi: {new Date(audit.lastSyncedAt).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-dark-gray font-semibold">
                <h3 className="font-bold text-dark-gray border-b border-dark-gray/10 pb-1">Edit Profil OPD & Pemeriksa</h3>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Nama OPD / Auditi</label>
                  <input
                    type="text"
                    value={metaSchoolName}
                    onChange={e => setMetaSchoolName(e.target.value)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-1.5 rounded bg-white/70 focus:bg-white text-dark-gray outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Tahun Anggaran</label>
                    <select
                      value={metaFiscalYear}
                      onChange={e => setMetaFiscalYear(e.target.value)}
                      className="w-full text-xs border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray font-bold"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                </div>
                  <div className="space-y-1 mt-2">
                    <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Status</label>
                    <select
                      value={metaStatus}
                      onChange={e => setMetaStatus(e.target.value as any)}
                      className="w-full text-xs border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray font-bold"
                    >
                      <option value="Draft">Draft KKA</option>
                      <option value="Sedang Berjalan">Audit Lapangan</option>
                      <option value="Direview">Review Pengendali</option>
                      <option value="Selesai">LHP Selesai</option>
                    </select>
                  </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Nama Auditor Utama</label>
                  <select
                    value={metaAuditorName}
                    onChange={e => setMetaAuditorName(e.target.value)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray outline-none focus:border-peach-accent"
                  >
                    <option value="" disabled>Pilih Ketua Tim</option>
                    {userProfiles.map(p => {
                      const label = p.pangkat && p.golongan
                        ? `${p.full_name || p.email} — ${p.pangkat} (${p.golongan})`
                        : `${p.full_name || p.email} (${p.role})`;
                      return (
                        <option key={p.id} value={p.full_name || p.email}>{label}</option>
                      );
                    })}
                    {/* Fallback if user is not in profiles */}
                    {!userProfiles.some(p => (p.full_name || p.email) === metaAuditorName) && metaAuditorName && (
                      <option value={metaAuditorName}>{metaAuditorName}</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1 relative">
                  <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Anggota Tim (Pilih Beberapa)</label>
                  <div 
                    onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded bg-white text-dark-gray cursor-pointer flex justify-between items-center"
                  >
                    <span className="truncate">
                      {metaTeamMembers.length > 0 
                        ? metaTeamMembers.join(', ')
                        : 'Pilih Anggota Tim...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-dark-gray/60" />
                  </div>
                  
                  {isTeamDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-dark-gray/15 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {userProfiles.map(p => {
                        const val = p.full_name || p.email;
                        const isChecked = metaTeamMembers.includes(val);
                        const sublabel = p.pangkat && p.golongan
                          ? `${p.pangkat} · ${p.golongan}`
                          : p.role;
                        return (
                          <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer border-b border-dark-gray/5 last:border-b-0">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setMetaTeamMembers([...metaTeamMembers, val]);
                                } else {
                                  setMetaTeamMembers(metaTeamMembers.filter(m => m !== val));
                                }
                              }}
                              className="rounded border-dark-gray/20 text-peach-accent focus:ring-peach-accent/30"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-dark-gray truncate">{val}</div>
                              <div className="text-[10px] text-dark-gray/55 font-semibold">{sublabel}</div>
                            </div>
                          </label>
                        );
                      })}
                      {userProfiles.length === 0 && (
                        <div className="p-3 text-xs text-center text-dark-gray/50 italic">Tidak ada profil tersedia</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-dark-gray/10">
                  <button 
                    onClick={() => setIsEditingMetadata(false)}
                    className="flex-1 text-[11px] bg-white py-1.5 rounded font-extrabold text-dark-gray border border-dark-gray/15 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveMetadata}
                    className="flex-1 text-[11px] bg-peach-accent py-1.5 rounded font-extrabold text-dark-gray border border-dark-gray/10 shadow-xs cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Category/Instrument Navigation Controller with responsive list */}
          <div className="bg-baby-blue rounded-xl border border-dark-gray/10 p-4 shadow-xs space-y-3 text-dark-gray">
            <div className="flex items-center justify-between pb-2 border-b border-dark-gray/10">
              <span className="text-[10px] font-bold text-dark-gray/60 uppercase tracking-wider block">Jenis Audit Pemeriksaan</span>
              {userRole === 'Auditor' && !isReadOnly && (
                <button 
                  onClick={() => setIsAddingCategory(true)}
                  className="text-xs text-dark-gray hover:text-dark-gray/70 inline-flex items-center gap-0.5 font-extrabold cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Tambah
                </button>
              )}
            </div>

            {/* Mobile Dropdown (shown on smaller screens) */}
            <div className="block lg:hidden">
              <select
                value={selectedCategoryId}
                onChange={e => setSelectedCategoryId(e.target.value)}
                className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-hidden"
              >
                {audit.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Full Menu (Hidden on mobile) */}
            <div className="hidden lg:block space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
              {audit.categories.map(cat => {
                const isActive = cat.id === selectedCategoryId;
                const temuanCount = cat.items.filter(item => item.status === 'Temuan').length;
                return (
                  <div 
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`group flex items-center justify-between text-xs p-2.5 rounded-lg cursor-pointer transition-all border ${
                      isActive 
                        ? 'bg-dark-gray border-transparent text-white shadow-xs font-bold' 
                        : 'bg-white/40 border-dark-gray/5 text-dark-gray hover:bg-white/70 hover:text-dark-gray font-semibold'
                    }`}
                  >
                    <span className="truncate pr-1">{cat.name}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {temuanCount > 0 && (
                        <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-mono ${
                          isActive ? 'bg-peach-accent text-dark-gray font-black' : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}>
                          {temuanCount}!
                        </span>
                      )}
                      
                      {/* Delete category button */}
                      {userRole === 'Auditor' && !isReadOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(cat.id);
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-red-50 hover:text-red-600 border border-transparent ${
                            isActive ? 'text-white/60 hover:bg-dark-gray/50 hover:text-white' : 'text-dark-gray/40'
                          }`}
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Active Category Items List */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Active Category Header Card */}
          {activeCategory && (
            <div className="bg-dark-gray text-white rounded-xl p-5 border border-white/5 shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold tracking-tight text-white leading-tight">
                    {activeCategory.name}
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed max-w-2xl">
                    {activeCategory.description}
                  </p>
                </div>
                
                {/* Category stats badges (Mobile friendly flex block) */}
                <span className="text-[10px] bg-white/10 border border-white/10 px-2 py-1 rounded font-mono text-white/90 flex-shrink-0 font-bold uppercase">
                  {categoryStats.totItems} Kriteria Uji
                </span>
              </div>

              {/* Dynamic summary of findings */}
              {categoryStats.totTemuan > 0 && (
                <div className="mt-3.5 bg-rose-500/20 border border-rose-500/25 p-2.5 rounded-lg text-xs text-rose-100 font-semibold inline-flex items-center gap-2 flex-wrap">
                  <AlertTriangle className="w-4 h-4 text-rose-300 animate-bounce flex-shrink-0" />
                  <span>Ditemukan <span className="underline font-bold font-mono">{categoryStats.totTemuan}</span> penyimpangan / temuan keuangan senilai <span className="font-mono font-bold text-peach-accent">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(categoryStats.totVal)}</span></span>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Criteria checklist stream */}
          <div className="space-y-4">
            
            {/* Header Checklist & Action to trigger ADD item */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-dark-gray/75 uppercase tracking-wider block">Spesifikasi Bukti & Pertanggungjawaban</span>
              {userRole === 'Auditor' && !isReadOnly && (
                <button 
                  onClick={() => setIsAddingItem(true)}
                  className="bg-peach-accent hover:opacity-90 border border-dark-gray/10 text-dark-gray text-xs font-extrabold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Kriteria
                </button>
              )}
            </div>

            {/* Checklists items */}
            {activeCategory && activeCategory.items.map((item, idx) => {
              const hasFinding = item.status === 'Temuan';
              return (
                <div 
                  key={item.id} 
                  className={`bg-baby-blue rounded-xl border border-dark-gray/10 p-4 transition-all shadow-xs text-dark-gray ${
                    hasFinding ? 'border-l-4 border-l-rose-500 bg-rose-400/10' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    
                    {/* Title and Descriptions */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono select-none px-2 py-0.5 rounded bg-white/40 text-dark-gray/70 font-bold">
                          Kriteria {idx + 1}
                        </span>
                        <h4 className="text-xs md:text-sm font-bold text-dark-gray leading-tight">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-dark-gray/85 leading-relaxed pt-0.5 font-medium">
                        {item.description}
                      </p>
                    </div>

                    {/* Checkbox Status Row Selector */}
                    <div className="flex items-center gap-1.5 bg-white/50 p-1.5 rounded-lg self-start md:self-auto flex-shrink-0 border border-dark-gray/10">
                      <button
                        disabled={isReadOnly}
                        onClick={() => handleItemStatusChange(item.id, 'Sesuai')}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-md transition-all ${!isReadOnly && 'cursor-pointer'} ${
                          item.status === 'Sesuai' 
                            ? 'bg-emerald-600 text-white shadow-md scale-105' 
                            : `bg-emerald-50 text-emerald-700/70 border border-emerald-200/50 ${!isReadOnly && 'hover:bg-emerald-100 hover:text-emerald-800'}`
                        } ${isReadOnly && 'opacity-70'}`}
                      >
                        Sesuai
                      </button>
                      <button
                        disabled={isReadOnly}
                        onClick={() => handleItemStatusChange(item.id, 'Temuan')}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-md transition-all ${!isReadOnly && 'cursor-pointer'} ${
                          item.status === 'Temuan' 
                            ? 'bg-rose-600 text-white shadow-md scale-105' 
                            : `bg-rose-50 text-rose-700/70 border border-rose-200/50 ${!isReadOnly && 'hover:bg-rose-100 hover:text-rose-800'}`
                        } ${isReadOnly && 'opacity-70'}`}
                      >
                        Temuan
                      </button>
                      <button
                        disabled={isReadOnly}
                        onClick={() => handleItemStatusChange(item.id, 'N/A')}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-md transition-all ${!isReadOnly && 'cursor-pointer'} ${
                          item.status === 'N/A' 
                            ? 'bg-slate-700 text-white shadow-md scale-105' 
                            : `bg-slate-100 text-slate-600/70 border border-slate-200/50 ${!isReadOnly && 'hover:bg-slate-200 hover:text-slate-800'}`
                        } ${isReadOnly && 'opacity-70'}`}
                      >
                        N/A
                      </button>
                    </div>
                  </div>

                  {/* Dropdown collapsible detail form IF 'Temuan Keuangan' is ticked */}
                  {hasFinding && (
                    <div className="mt-4 pt-4 border-t border-dashed border-rose-500/25 grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up text-xs text-dark-gray">
                      
                      {/* Left Block: Classification and Rupiah */}
                      <div className="space-y-3 font-semibold">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide block">Klasifikasi Temuan</label>
                          <select
                            disabled={isReadOnly || userRole !== 'Auditor'}
                            value={item.jenisTemuan || 'Tidak Sesuai Juknis'}
                            onChange={e => handleFindingDetailChange(item.id, 'jenisTemuan', e.target.value)}
                            className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white shadow-xs disabled:bg-white/40 disabled:cursor-not-allowed select-none outline-none text-dark-gray"
                          >
                            <option value="Kelebihan Pembayaran">Kelebihan Pembayaran (Overpayment)</option>
                            <option value="Belanja Fiktif">Belanja Fiktif (Manipulasi / Kwitansi Palsu)</option>
                            <option value="Pemborosan">Pemborosan (Inefisiensi Anggaran)</option>
                            <option value="Pajak Belum Disetor">Pajak Belum Disetor ke Kas Negara</option>
                            <option value="Tidak Sesuai Juknis">Penggunaan Dana Tidak Sesuai Juknis BOS</option>
                            <option value="Lainnya">Lain-lain / Administrasi Kurang Lengkap</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide block">Nilai Temuan Keuangan (IDR)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-dark-gray/50 font-mono font-bold pointer-events-none">
                              Rp
                            </span>
                            <input
                              disabled={isReadOnly || userRole !== 'Auditor'}
                              type="number"
                              placeholder="Misal: 1000000"
                              value={item.nilaiTemuan || ''}
                              onChange={e => handleFindingDetailChange(item.id, 'nilaiTemuan', parseFloat(e.target.value) || 0)}
                              className="w-full text-xs font-mono font-bold border border-dark-gray/15 pl-9 p-2 rounded-lg bg-white/70 focus:bg-white disabled:bg-white/40 disabled:cursor-not-allowed outline-none text-dark-gray"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Descriptions & Recommendations */}
                      <div className="space-y-3 font-semibold">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide block">Uraian Penyimpangan / Detail Temuan</label>
                          <textarea
                            disabled={isReadOnly || userRole !== 'Auditor'}
                            placeholder="Uraikan temuan fisik secara detail, nominal, dan nomor berkas kuitansi terkait..."
                            value={item.uraianTemuan || ''}
                            onChange={e => handleFindingDetailChange(item.id, 'uraianTemuan', e.target.value)}
                            rows={2}
                            className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white/70 focus:bg-white resize-none disabled:bg-white/40 disabled:cursor-not-allowed outline-none text-dark-gray"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide block">Rekomendasi Tindak Lanjut Inspektorat</label>
                          <textarea
                            disabled={isReadOnly || userRole !== 'Auditor'}
                            placeholder="Rekomendasi tindakan hukum/administratif, pengembalian kas, atau peneguran tertulis..."
                            value={item.rekomendasi || ''}
                            onChange={e => handleFindingDetailChange(item.id, 'rekomendasi', e.target.value)}
                            rows={2}
                            className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white/70 focus:bg-white resize-none disabled:bg-white/40 disabled:cursor-not-allowed outline-none text-dark-gray"
                          />
                        </div>
                      </div>

                      {/* Delete action button for item */}
                      {userRole === 'Auditor' && !isReadOnly && (
                        <div className="md:col-span-2 pt-1.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-[10px] text-rose-700 hover:text-rose-950 font-extrabold inline-flex items-center gap-0.5 cursor-pointer bg-white/50 border border-dark-gray/10 px-2 py-1 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus Kriteria
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SPESIFIKASI BUKTI — delegated to EvidencePanel */}
                  <EvidencePanel
                    evidenceLink={item.evidenceLink}
                    evidenceName={item.evidenceName}
                    isReadOnly={isReadOnly}
                    isAuditor={userRole === 'Auditor'}
                    isUploading={!!uploadingIds[item.id]}
                    isCopying={!!copyingIds[item.id]}
                    onUploadFile={async (file) => handleDirectUpload(item.id, file)}
                    onCopyFromUrl={async (url, name) => handleDirectCopy(item.id, url, name)}
                    onChangeLink={(link) => handleFindingDetailChange(item.id, 'evidenceLink', link)}
                    onChangeName={(name) => handleFindingDetailChange(item.id, 'evidenceName', name)}
                    onClear={() => {
                      handleFindingDetailsUpdate(item.id, {
                        evidenceLink: '',
                        evidenceName: ''
                      });
                    }}
                  />

                  {/* CATATAN REVIEW / EVALUASI (Inspektur Pembantu / Inspektur) */}
                  <div className="mt-3.5 bg-amber-100/45 border border-amber-200/50 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-950 text-[10px] tracking-tight uppercase flex items-center gap-1">
                        ⭐ Catatan Review Pengendalian Mutu (Pimpinan)
                      </span>
                      {item.catatanReview && (
                        <span className="text-[9px] bg-amber-200 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-mono uppercase font-black">
                          Ditanggapi
                        </span>
                      )}
                    </div>

                    {userRole === 'Auditor' || (isReadOnly && audit.status === 'Selesai') ? (
                      <p className="text-[11px] text-amber-900 bg-white/20 p-2 border border-amber-200/40 rounded italic font-bold leading-relaxed">
                        {item.catatanReview || 'Belum ada catatan pembinaan/evaluasi dari pimpinan (Inspektur atau Irban).'}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        <textarea
                          placeholder="Tulis ulasan review, koreksi bukti SPESIFIKASI, arahan revisi angka temuan, atau persetujuan di sini..."
                          value={item.catatanReview || ''}
                          onChange={(e) => handleFindingDetailChange(item.id, 'catatanReview', e.target.value)}
                          rows={3}
                          className="w-full min-h-[70px] text-xs font-bold border border-amber-200/50 p-2.5 rounded-lg bg-white/80 focus:bg-white outline-none text-dark-gray shadow-xs"
                        />
                        <p className="text-[9.5px] text-amber-900/80 italic font-mono font-bold">Tersimpan otomatis sebagai rancangan ulasan review pimpinan ({userRole}).</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Fallback delete button if NOT currently expanded */}
                  {!hasFinding && userRole === 'Auditor' && !isReadOnly && (
                    <div className="mt-2.5 pt-2 border-t border-dark-gray/10 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-[10px] text-rose-700 hover:text-rose-950 font-bold inline-flex items-center gap-0.5 cursor-pointer bg-white/40 border border-dark-gray/10 px-2 py-0.5 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Kriteria
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Custom Category Popup Form */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-dark-gray/10 text-dark-gray">
            <div className="bg-dark-gray text-white px-4 py-3 flex items-center justify-between">
              <span className="font-extrabold text-xs tracking-wide">Tambah Kategori Baru (A.1)</span>
              <button onClick={() => setIsAddingCategory(false)} className="text-white/80 hover:text-white font-xs font-bold cursor-pointer">Tutup</button>
            </div>
            <form onSubmit={handleAddCategory} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Pilih Kategori KKA</label>
                {availableMasterCategories.length > 0 ? (
                  <select
                    value={selectedMasterCatId}
                    onChange={e => setSelectedMasterCatId(e.target.value)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-none focus:border-peach-accent"
                    required
                  >
                    <option value="" disabled>-- Pilih Kategori --</option>
                    {availableMasterCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100 font-semibold">
                    Semua kategori dari {audit.auditType || 'Jenis Audit ini'} sudah ditambahkan ke dalam pemeriksaan ini.
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-dark-gray/10">
                <button type="button" onClick={() => setIsAddingCategory(false)} className="flex-1 bg-white py-2 border border-dark-gray/15 rounded-lg font-bold text-dark-gray cursor-pointer">Batal</button>
                <button type="submit" disabled={!selectedMasterCatId} className="flex-1 bg-peach-accent border border-dark-gray/10 py-2 rounded-lg font-black text-dark-gray hover:opacity-90 cursor-pointer disabled:opacity-50">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Checklist Item Popup Form */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-dark-gray/10 text-dark-gray">
            <div className="bg-dark-gray text-white px-4 py-3 flex items-center justify-between">
              <span className="font-extrabold text-xs tracking-wide">Tambah Kriteria Pemeriksaan</span>
              <button onClick={() => setIsAddingItem(false)} className="text-white/80 hover:text-white font-xs font-bold cursor-pointer">Tutup</button>
            </div>
            <form onSubmit={handleAddItem} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Judul Kriteria Pemeriksaan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Surat Pertanggungjawaban (SPJ) Transportasi Guru"
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white/70 focus:bg-white text-dark-gray outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Deskripsi Uji Bukti Fisik</label>
                <textarea
                  placeholder="Uraikan hal murni apa yang diuji (nota, stempel, pemotongan PPh)..."
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-medium border border-dark-gray/15 p-2 rounded-lg bg-white/70 focus:bg-white resize-none outline-none text-dark-gray"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-dark-gray/10">
                <button type="button" onClick={() => setIsAddingItem(false)} className="flex-1 bg-white py-2 border border-dark-gray/15 rounded-lg font-bold text-dark-gray cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 bg-peach-accent border border-dark-gray/10 py-2 rounded-lg font-black text-dark-gray hover:opacity-90 cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
