import React, { useState, useMemo } from 'react';
import { OpdAudit, AuditCategory, AuditItem, AuditStatus, FindingStatus, UserProfile, KKATemplate } from '../types';
import { uploadEvidenceFile, copyEvidenceFileFromUrl } from '../lib/googleDrive';
import { supabase } from '../lib/supabase';
import EvidencePanel from './EvidencePanel';
import {
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  ChevronDown,
  ShieldOff,
  Lock
} from 'lucide-react';

const byNipAge = (a: UserProfile, b: UserProfile) => {
  if (a.nip && b.nip) return a.nip.localeCompare(b.nip);
  if (a.nip) return -1;
  if (b.nip) return 1;
  return (a.full_name || '').localeCompare(b.full_name || '');
};

const KETUA_TIM_ROLES = [
  'Auditor',
  'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];
const STRUKTURAL_ROLES = ['Inspektur', 'Inspektur Pembantu'];
const FUNGSIONAL_ROLES = [
  'Auditor',
  'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
  'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];

interface AuditWorkspaceViewProps {
  audit: OpdAudit;
  onBack: () => void;
  onUpdates: (updatedAudit: OpdAudit) => void;
  onSync: (audit: OpdAudit) => void;
  isDriveConnected: boolean;
  isSyncing: boolean;
  userRole?: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur';
  isAdmin?: boolean;
  accessToken?: string | null;
  userProfiles: UserProfile[];
  templates: KKATemplate[];
  currentUserName?: string;
  initialCategoryId?: string | null;
  onShowToast?: (message: string, type: 'error' | 'info' | 'success') => void;
}

export default function AuditWorkspaceView({
  audit,
  onBack,
  onUpdates,
  onSync,
  isDriveConnected,
  isSyncing,
  userRole = 'Auditor',
  isAdmin = false,
  accessToken = null,
  userProfiles = [],
  templates = [],
  currentUserName = '',
  initialCategoryId = null,
  onShowToast
}: AuditWorkspaceViewProps) {

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialCategoryId || (audit.categories.length > 0 ? audit.categories[0].id : '')
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [dragItemIdx, setDragItemIdx] = useState<number | null>(null);

  const [uploadingIds, setUploadingIds] = useState<Record<string, boolean>>({});

  const handleDirectUpload = async (itemId: string, file: File, newName?: string) => {
    const hasConflict = await checkConflict(itemId, 'Unggah dokumen');
    if (hasConflict) return;

    setUploadingIds(prev => ({ ...prev, [itemId]: true }));
    try {
      const fileToUpload = newName ? new File([file], newName, { type: file.type }) : file;
      const res = await uploadEvidenceFile(fileToUpload, audit.fiscalYear, audit.opdName, audit.auditType);
      const existingItem = audit.categories.flatMap(c => c.items).find(i => i.id === itemId);
      const prevHistory = existingItem?.evidenceHistory || [];
      const historyEntry = {
        name: res.name,
        link: res.webViewLink,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUserName || audit.auditorName || 'Auditor',
        action: 'diunggah' as const
      };
      handleFindingDetailsUpdate(itemId, {
        evidenceLink: res.webViewLink,
        evidenceName: res.name,
        evidenceHistory: [...prevHistory, historyEntry]
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

    const hasConflict = await checkConflict(itemId, 'Tautkan dokumen');
    if (hasConflict) return;

    setCopyingIds(prev => ({ ...prev, [itemId]: true }));
    try {
      const res = await copyEvidenceFileFromUrl(sourceUrl, currentName || `Copy_of_${itemId}`, audit.fiscalYear, audit.opdName, audit.auditType);
      const existingItem = audit.categories.flatMap(c => c.items).find(i => i.id === itemId);
      const prevHistory = existingItem?.evidenceHistory || [];
      const historyEntry = {
        name: res.name,
        link: res.webViewLink,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUserName || audit.auditorName || 'Auditor',
        action: 'ditautkan' as const
      };
      handleFindingDetailsUpdate(itemId, {
        evidenceLink: res.webViewLink,
        evidenceName: res.name,
        evidenceHistory: [...prevHistory, historyEntry]
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
  const [newCatAuditorName, setNewCatAuditorName] = useState(audit.auditorName || '');
  const [newCatTeamMembers, setNewCatTeamMembers] = useState<string[]>([]);
  const [isNewCatAuditorDropdownOpen, setIsNewCatAuditorDropdownOpen] = useState(false);
  const [newCatAuditorSearchQuery, setNewCatAuditorSearchQuery] = useState('');
  const [isNewCatTeamDropdownOpen, setIsNewCatTeamDropdownOpen] = useState(false);
  const [newCatTeamSearchQuery, setNewCatTeamSearchQuery] = useState('');

  const [isEditingCategoryTeam, setIsEditingCategoryTeam] = useState(false);
  const [editCatAuditorName, setEditCatAuditorName] = useState('');
  const [editCatTeamMembers, setEditCatTeamMembers] = useState<string[]>([]);
  const [editCatFiscalYear, setEditCatFiscalYear] = useState('');
  const [editCatStatus, setEditCatStatus] = useState<AuditStatus>('Draft');
  const [isEditCatAuditorDropdownOpen, setIsEditCatAuditorDropdownOpen] = useState(false);
  const [editCatAuditorSearchQuery, setEditCatAuditorSearchQuery] = useState('');
  const [isEditCatTeamDropdownOpen, setIsEditCatTeamDropdownOpen] = useState(false);
  const [editCatTeamSearchQuery, setEditCatTeamSearchQuery] = useState('');

  const activeCategory = useMemo(() => {
    return audit.categories.find(c => c.id === selectedCategoryId);
  }, [audit.categories, selectedCategoryId]);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return [];
    if (!searchQuery.trim()) return activeCategory.items;
    const query = searchQuery.toLowerCase();
    return activeCategory.items.filter(item =>
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.evidenceName && item.evidenceName.toLowerCase().includes(query)) ||
      (item.evidenceHistory && item.evidenceHistory.some(h => h.name && h.name.toLowerCase().includes(query)))
    );
  }, [activeCategory, searchQuery]);

  const currentTemplate = useMemo(() => {
    return templates?.find(t => t.name === audit.auditType);
  }, [templates, audit.auditType]);

  const availableMasterCategories = useMemo(() => {
    if (!templates) return [];
    const allMasterCategories = templates.flatMap(t => t.categories);
    const unique = [];
    const seen = new Set();
    for (const tc of allMasterCategories) {
      if (!seen.has(tc.name) && !audit.categories.find(ac => ac.name === tc.name)) {
        unique.push(tc);
        seen.add(tc.name);
      }
    }
    return unique;
  }, [templates, audit.categories]);

  const isTeamMember = STRUKTURAL_ROLES.includes(userRole) || !FUNGSIONAL_ROLES.includes(userRole) || !currentUserName || audit.categories.some(cat => {
    const currNameLower = currentUserName.toLowerCase().trim();
    return (cat.auditorName || '').toLowerCase().trim() === currNameLower ||
           (cat.teamMembers || []).some(m => m.toLowerCase().trim() === currNameLower);
  });

  const isReadOnly = !isTeamMember ||
    (activeCategory?.status === 'Selesai' || audit.status === 'Selesai') ||
    (FUNGSIONAL_ROLES.includes(userRole) && activeCategory?.status === 'Direview');

  const checkConflict = async (itemId: string, actionName: string = 'Perubahan'): Promise<boolean> => {
    if (!navigator.onLine) return false;
    if (isSyncing) return false;

    try {
      const { data, error } = await supabase.from('audits').select('categories').eq('id', audit.id).single();
      if (data && data.categories) {
        const remoteItem = data.categories.flatMap((c: any) => c.items).find((i: any) => i.id === itemId);
        const localItem = activeCategory?.items.find(i => i.id === itemId) || audit.categories.flatMap(c => c.items).find(i => i.id === itemId);

        if (remoteItem && localItem) {
          const hasStatusConflict = remoteItem.status !== localItem.status;
          const hasEvidenceConflict = remoteItem.evidenceLink !== localItem.evidenceLink || (remoteItem.evidenceHistory?.length || 0) !== (localItem.evidenceHistory?.length || 0);

          if (hasStatusConflict || hasEvidenceConflict) {
            onShowToast?.(`${actionName} ditolak. Data telah dimodifikasi pengguna lain. Menyelaraskan data terbaru...`, 'error');
            onUpdates({ ...audit, categories: data.categories });
            return true;
          }
        }
      }
    } catch (err) {
      console.error('Failed to check conflict', err);
    }
    return false;
  };

  const handleItemStatusChange = async (itemId: string, status: FindingStatus) => {
    if (isReadOnly) return;

    const hasConflict = await checkConflict(itemId, 'Ubah status');
    if (hasConflict) return;

    const updatedCategories = audit.categories.map(cat => {
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id === itemId) {
            const isNowTemuan = status === 'Temuan';
            return {
              ...item,
              status,
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

  const handleFindingDetailChange = (itemId: string, field: keyof AuditItem, value: any) => {
    if (isReadOnly && field !== 'catatanReview') return;
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

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !activeCategory) return;

    const newItem: AuditItem = {
      id: `item_temp_${Date.now()}`,
      title: newItemTitle.trim(),
      description: newItemDescription.trim(),
      status: 'N/A',
      nilaiTemuan: 0,
      uraianTemuan: '',
      rekomendasi: ''
    };

    const updatedCategories = audit.categories.map(cat => {
      if (cat.id === activeCategory.id) {
        return { ...cat, items: [...cat.items, newItem] };
      }
      return cat;
    });

    onUpdates({ ...audit, categories: updatedCategories });
    setNewItemTitle('');
    setNewItemDescription('');
    setIsAddingItem(false);
  };

  const handleDragStart = (index: number) => {
    setDragItemIdx(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIdx: number) => {
    if (dragItemIdx === null || !activeCategory || searchQuery.trim()) return;

    const items = [...activeCategory.items];
    const [moved] = items.splice(dragItemIdx, 1);
    items.splice(targetIdx, 0, moved);

    const updatedCategories = audit.categories.map(cat => {
      if (cat.id === activeCategory.id) {
        return { ...cat, items };
      }
      return cat;
    });

    onUpdates({ ...audit, categories: updatedCategories });
    setDragItemIdx(null);
  };

  const handleDeleteItem = (itemId: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus dokumen pemeriksaan ini dari berkas KKA?');
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

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterCatId) return;

    const masterCat = availableMasterCategories.find(c => c.id === selectedMasterCatId);
    if (!masterCat) return;

    const newCategory: AuditCategory = {
      id: `cat_custom_${Date.now()}`,
      name: masterCat.name,
      description: masterCat.description,
      auditorName: newCatAuditorName,
      teamMembers: newCatTeamMembers,
      fiscalYear: audit.fiscalYear,
      status: 'Draft',
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

    setIsAddingCategory(false);
    setSelectedMasterCatId('');
    setNewCatTeamMembers([]);
  };

  const openEditCategoryTeam = () => {
    if (!activeCategory) return;
    setEditCatAuditorName(activeCategory.auditorName || audit.auditorName || '');
    setEditCatTeamMembers(activeCategory.teamMembers || []);
    setEditCatFiscalYear(activeCategory.fiscalYear || audit.fiscalYear);
    setEditCatStatus(activeCategory.status || 'Draft');
    setIsEditingCategoryTeam(true);
  };

  const handleSaveCategoryTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory) return;

    const updatedCategories = audit.categories.map(cat => {
      if (cat.id === activeCategory.id) {
        return {
          ...cat,
          auditorName: editCatAuditorName,
          teamMembers: editCatTeamMembers,
          fiscalYear: editCatFiscalYear,
          status: editCatStatus
        };
      }
      return cat;
    });

    onUpdates({
      ...audit,
      categories: updatedCategories
    });
    setIsEditingCategoryTeam(false);
  };

  const handleDeleteCategory = (catId: string) => {
    if (audit.categories.length <= 1) {
      alert('Pemeriksaan KKA harus menyisakan minimal satu Jenis Audit Pemeriksaan utama.');
      return;
    }

    const name = audit.categories.find(c => c.id === catId)?.name || '';
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus Jenis Audit Pemeriksaan "${name}" beserta seluruh dokumen di dalamnya?`);
    if (!confirmed) return;

    const updatedCategories = audit.categories.filter(c => c.id !== catId);

    onUpdates({
      ...audit,
      categories: updatedCategories
    });

    if (selectedCategoryId === catId) {
      setSelectedCategoryId(updatedCategories[0].id);
    }
  };

  const handleSaveCoverToDokumen1 = async (file: File) => {
    const targetCategory = activeCategory || audit.categories[0];
    if (!targetCategory) {
      onShowToast?.("Tidak ada jenis audit aktif untuk dilampirkan.", "error");
      return;
    }

    try {
      const res = await uploadEvidenceFile(file, audit.fiscalYear, audit.opdName, audit.auditType);

      const historyEntry = {
        name: file.name,
        link: res.webViewLink,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUserName || audit.auditorName || 'Auditor',
        action: 'diunggah' as const
      };

      const newId = `item_sampul_${Date.now()}`;
      const newItem: AuditItem = {
        id: newId,
        title: `Sampul KKP`,
        description: `Dokumen Sampul KKP untuk ${targetCategory.name}`,
        status: 'N/A' as const,
        nilaiTemuan: 0,
        uraianTemuan: '',
        rekomendasi: '',
        evidenceLink: res.webViewLink,
        evidenceName: file.name,
        evidenceHistory: [historyEntry]
      };

      const updatedCategories = audit.categories.map(cat => {
        if (cat.id !== targetCategory.id) return cat;
        return {
          ...cat,
          items: [newItem, ...cat.items]
        };
      });

      onUpdates({
        ...audit,
        categories: updatedCategories
      });
      onShowToast?.('Sampul berhasil disimpan sebagai Dokumen 1!', 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast?.(`Gagal menyimpan sampul: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-5 text-dark-gray" id="audit-workspace-view">

      {!isTeamMember && FUNGSIONAL_ROLES.includes(userRole) && (
        <div className="flex items-start gap-4 bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <ShieldOff className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-rose-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Akses Terbatas — Hanya Baca
            </p>
            <p className="text-xs text-rose-700/80 mt-1 font-medium leading-relaxed">
              Akun Anda (<strong>{currentUserName}</strong>) tidak terdaftar sebagai <strong>Ketua Tim</strong> maupun <strong>Anggota Tim</strong> pada jenis audit manapun di berkas ini. Hubungi supervisor untuk mendapatkan akses edit.
            </p>
          </div>
        </div>
      )}

      {/* Entity Header */}
      <div>
        <h1 className="text-xl font-black text-dark-gray">{audit.opdName}</h1>
        <p className="text-xs text-dark-gray/70 mt-0.5">Jenjang {audit.opdType} • TA {audit.fiscalYear}</p>
      </div>

      {/* Category Selector + Team Info + Review Actions */}
      <div className="bg-baby-blue rounded-xl border border-dark-gray/10 p-4 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <select
            value={selectedCategoryId}
            onChange={e => setSelectedCategoryId(e.target.value)}
            className="flex-1 text-sm font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none"
          >
            {audit.categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            {STRUKTURAL_ROLES.includes(userRole) && !isReadOnly && (
              <>
                {audit.categories.length > 1 && (
                  <button
                    onClick={() => handleDeleteCategory(selectedCategoryId)}
                    className="p-1.5 text-dark-gray/40 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Hapus Jenis Audit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="text-xs font-extrabold text-dark-gray/70 hover:text-dark-gray cursor-pointer"
                >
                  + Tambah
                </button>
              </>
            )}
            {(currentUserName === activeCategory?.auditorName || STRUKTURAL_ROLES.includes(userRole)) && (
              <button
                onClick={openEditCategoryTeam}
                className="p-1.5 text-dark-gray/40 hover:text-dark-gray/70 transition-colors cursor-pointer"
                title="Edit Tim"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-dark-gray/60 font-medium space-y-0.5">
          <p>Ketua Tim: <span className="font-bold text-dark-gray">{activeCategory?.auditorName || 'Belum diatur'}</span></p>
          <p>Anggota: <span className="font-bold text-dark-gray">{activeCategory?.teamMembers?.length ? activeCategory.teamMembers.join(', ') : 'Belum diatur'}</span></p>
        </div>

        {/* Review Workflow Buttons */}
        {activeCategory && (
          <div className="flex items-center gap-2 pt-1">
            {currentUserName === activeCategory.auditorName && (!activeCategory.status || activeCategory.status === 'Draft' || activeCategory.status === 'Sedang Berjalan') && (
              <button
                onClick={() => {
                  const confirmed = window.confirm('Apakah Anda yakin ingin mengajukan Jenis Audit ini untuk direview oleh pimpinan?');
                  if (confirmed) {
                    const newCategories = audit.categories.map(c => c.id === activeCategory.id ? { ...c, status: 'Direview' as any } : c);
                    const recalcStatus = newCategories.every(c => c.status === 'Selesai') ? 'Selesai' : newCategories.some(c => c.status === 'Direview') ? 'Direview' : 'Sedang Berjalan';
                    onUpdates({ ...audit, status: recalcStatus, categories: newCategories });
                    onShowToast?.('Jenis Audit telah diajukan ke Irban untuk direview.', 'success');
                  }
                }}
                className="text-[10px] px-3 py-1.5 rounded-lg font-extrabold bg-blue-500 text-white hover:bg-blue-600 transition cursor-pointer"
              >
                Ajukan Review
              </button>
            )}

            {STRUKTURAL_ROLES.includes(userRole) && activeCategory.status === 'Direview' && (
              <>
                <button
                  onClick={() => {
                    const confirmed = window.confirm('Apakah Anda menyetujui Jenis Audit ini menjadi Selesai?');
                    if (confirmed) {
                      const newCategories = audit.categories.map(c => c.id === activeCategory.id ? { ...c, status: 'Selesai' as any } : c);
                      const recalcStatus = newCategories.every(c => c.status === 'Selesai') ? 'Selesai' : newCategories.some(c => c.status === 'Direview') ? 'Direview' : 'Sedang Berjalan';
                      onUpdates({ ...audit, status: recalcStatus, categories: newCategories });
                      onShowToast?.('Jenis Audit telah disetujui. Auditor akan mendapatkan notifikasi.', 'success');
                    }
                  }}
                  className="text-[10px] px-3 py-1.5 rounded-lg font-extrabold bg-emerald-500 text-white hover:bg-emerald-600 transition cursor-pointer"
                >
                  Setujui
                </button>
                <button
                  onClick={() => {
                    const confirmed = window.confirm('Apakah Anda ingin mengembalikan Jenis Audit ini ke Auditor untuk direvisi?');
                    if (confirmed) {
                      const newCategories = audit.categories.map(c => c.id === activeCategory.id ? { ...c, status: 'Sedang Berjalan' as any } : c);
                      const recalcStatus = newCategories.every(c => c.status === 'Selesai') ? 'Selesai' : newCategories.some(c => c.status === 'Direview') ? 'Direview' : 'Sedang Berjalan';
                      onUpdates({ ...audit, status: recalcStatus, categories: newCategories });
                      onShowToast?.('Jenis Audit dikembalikan. Auditor akan mendapatkan notifikasi revisi.', 'info');
                    }
                  }}
                  className="text-[10px] px-3 py-1.5 rounded-lg font-extrabold bg-rose-500 text-white hover:bg-rose-600 transition cursor-pointer"
                >
                  Kembalikan Revisi
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Dokumen KKA */}
      <div className="bg-baby-blue rounded-xl border border-dark-gray/10 p-4 space-y-4 shadow-xs">
        <h2 className="text-sm font-black uppercase tracking-wide text-dark-gray">Dokumen KKA</h2>

        {/* Header + Tambah Item */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-dark-gray/75 uppercase tracking-wide">Spesifikasi Bukti & Pertanggungjawaban</span>
          {FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && (
            <button
              onClick={() => { setIsAddingItem(true); setSearchQuery(''); }}
              className="text-[10px] font-extrabold text-white bg-dark-gray hover:bg-dark-gray/80 px-2.5 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Tambah Item
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-gray/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari spesifikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-dark-gray/20 rounded-lg text-xs bg-white/50 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 outline-none text-dark-gray"
          />
        </div>

        {/* Add Item Form */}
        {isAddingItem && (
          <form onSubmit={handleAddItem} className="bg-white border-2 border-dashed border-dark-gray/30 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide">Nama Dokumen</label>
              <input
                type="text"
                required
                placeholder="Misal: Bukti SSP PPh Pasal 21"
                value={newItemTitle}
                onChange={e => setNewItemTitle(e.target.value)}
                className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none focus:ring-2 focus:ring-dark-gray/20"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide">Deskripsi (opsional)</label>
              <input
                type="text"
                placeholder="Keterangan tambahan..."
                value={newItemDescription}
                onChange={e => setNewItemDescription(e.target.value)}
                className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none focus:ring-2 focus:ring-dark-gray/20"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button type="submit" className="text-[10px] font-extrabold bg-dark-gray text-white px-3 py-1.5 rounded-lg hover:bg-dark-gray/80 transition cursor-pointer">
                Simpan
              </button>
              <button type="button" onClick={() => { setIsAddingItem(false); setNewItemTitle(''); setNewItemDescription(''); }}
                className="text-[10px] font-bold text-dark-gray/70 hover:text-dark-gray px-3 py-1.5 rounded-lg border border-dark-gray/20 hover:bg-dark-gray/5 transition cursor-pointer">
                Batal
              </button>
            </div>
          </form>
        )}

        {/* Items */}
        {filteredItems.map((item, idx) => {
          const isTemuan = item.status === 'Temuan';
          return (
            <div
              key={item.id}
              draggable={FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && !searchQuery.trim()}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              className={`bg-white rounded-xl border p-4 space-y-3 transition-all shadow-xs ${isTemuan ? 'border-l-4 border-l-rose-500 border-dark-gray/10' : 'border-dark-gray/10'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-baby-blue text-dark-gray/70 font-bold shrink-0">
                      Dokumen {idx + 1}
                    </span>
                    <h4 className="text-xs md:text-sm font-bold text-dark-gray">{item.title}</h4>
                  </div>
                  {item.description && (
                    <p className="text-xs text-dark-gray/70 mt-1 leading-relaxed">{item.description}</p>
                  )}
                </div>

                {/* Status Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={isReadOnly}
                    onClick={() => handleItemStatusChange(item.id, 'Sesuai')}
                    className={`text-[10px] font-black px-2.5 py-1.5 rounded-md transition-all ${!isReadOnly && 'cursor-pointer'} ${item.status === 'Sesuai'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-700/70 border border-emerald-200/50'
                    }`}
                  >
                    Sesuai
                  </button>
                  <button
                    disabled={isReadOnly}
                    onClick={() => handleItemStatusChange(item.id, 'Temuan')}
                    className={`text-[10px] font-black px-2.5 py-1.5 rounded-md transition-all ${!isReadOnly && 'cursor-pointer'} ${item.status === 'Temuan'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-rose-50 text-rose-700/70 border border-rose-200/50'
                    }`}
                  >
                    Temuan
                  </button>
                  <button
                    disabled={isReadOnly}
                    onClick={() => handleItemStatusChange(item.id, 'N/A')}
                    className={`text-[10px] font-black px-2.5 py-1.5 rounded-md transition-all ${!isReadOnly && 'cursor-pointer'} ${item.status === 'N/A'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600/70 border border-slate-200/50'
                    }`}
                  >
                    N/A
                  </button>
                </div>
              </div>

              {/* Temuan indicator (just a line, no detail) */}
              {isTemuan && (
                <div className="flex items-center gap-1.5 text-[10px] text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="font-bold">Temuan terdeteksi</span>
                </div>
              )}

              <EvidencePanel
                evidenceLink={item.evidenceLink}
                evidenceName={item.evidenceName}
                isReadOnly={isReadOnly}
                isAuditor={FUNGSIONAL_ROLES.includes(userRole)}
                isUploading={!!uploadingIds[item.id]}
                isCopying={!!copyingIds[item.id]}
                onUploadFile={async (file, newName) => handleDirectUpload(item.id, file, newName)}
                onCopyFromUrl={async (url, name) => handleDirectCopy(item.id, url, name)}
                onChangeLink={(link) => handleFindingDetailChange(item.id, 'evidenceLink', link)}
                onChangeName={(name) => handleFindingDetailChange(item.id, 'evidenceName', name)}
                onClear={async () => {
                  const hasConflict = await checkConflict(item.id, 'Hapus item');
                  if (hasConflict) return;

                  const prevHistory = item.evidenceHistory || [];
                  const historyEntry = {
                    name: item.evidenceName || 'Dokumen',
                    link: item.evidenceLink || '',
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: currentUserName || audit.auditorName || 'Auditor',
                    action: 'dihapus' as const
                  };
                  handleFindingDetailsUpdate(item.id, {
                    evidenceLink: '',
                    evidenceName: '',
                    evidenceHistory: [...prevHistory, historyEntry]
                  });
                  onShowToast?.('Dokumen dihapus secara lokal. Memproses sinkronisasi ke server (± 5 detik)...', 'info');
                }}
              />

              {FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-[10px] text-rose-700 hover:text-rose-950 font-bold inline-flex items-center gap-0.5 cursor-pointer bg-white border border-dark-gray/10 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus Dokumen
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-xs text-dark-gray/50 italic font-medium">
            {searchQuery.trim() ? 'Tidak ada spesifikasi yang cocok dengan pencarian.' : 'Belum ada item pemeriksaan. Klik "Tambah Item" untuk memulai.'}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-dark-gray/10 text-dark-gray">
            <div className="bg-dark-gray text-white px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <span className="font-extrabold text-xs tracking-wide">Tambah Jenis Audit Pemeriksaan Baru</span>
              <button onClick={() => setIsAddingCategory(false)} className="text-white/80 hover:text-white font-xs font-bold cursor-pointer">Tutup</button>
            </div>
            <form onSubmit={handleAddCategory} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Pilih Jenis Audit Pemeriksaan</label>
                {availableMasterCategories.length > 0 ? (
                  <select
                    value={selectedMasterCatId}
                    onChange={e => setSelectedMasterCatId(e.target.value)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none"
                    required
                  >
                    <option value="" disabled>-- Pilih Jenis Audit --</option>
                    {availableMasterCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100 font-semibold">
                    Semua opsi Jenis Audit Pemeriksaan dari sistem sudah ditambahkan ke dalam pemeriksaan ini.
                  </div>
                )}
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Ketua Tim</label>
                <div
                  onClick={() => setIsNewCatAuditorDropdownOpen(!isNewCatAuditorDropdownOpen)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray cursor-pointer flex justify-between items-center"
                >
                  <span>{newCatAuditorName || '-- Pilih Ketua Tim --'}</span>
                  <ChevronDown className="w-4 h-4 text-dark-gray/50" />
                </div>

                {isNewCatAuditorDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-dark-gray/15 rounded-lg shadow-lg overflow-hidden max-h-48 flex flex-col">
                    <div className="p-2 border-b border-dark-gray/10 bg-slate-50 sticky top-0">
                      <input
                        type="text"
                        placeholder="Cari nama..."
                        value={newCatAuditorSearchQuery}
                        onChange={(e) => setNewCatAuditorSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-[10px] font-medium border border-dark-gray/20 px-2 py-1.5 rounded bg-white outline-none"
                      />
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
                      {userProfiles
                        .filter(p => KETUA_TIM_ROLES.includes(p.role) && (p.full_name || p.email).toLowerCase().includes(newCatAuditorSearchQuery.toLowerCase()))
                        .sort(byNipAge)
                        .map(p => {
                          const isSelected = newCatAuditorName === (p.full_name || p.email);
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setNewCatAuditorName(p.full_name || p.email);
                                setIsNewCatAuditorDropdownOpen(false);
                                setNewCatAuditorSearchQuery('');
                              }}
                              className={`text-[10px] p-2 rounded cursor-pointer font-medium flex items-center justify-between ${
                                isSelected ? 'bg-peach-accent/20 text-dark-gray font-bold' : 'hover:bg-dark-gray/5 text-dark-gray/80'
                              }`}
                            >
                              <span>{p.full_name || p.email}</span>
                              {isSelected && <Check className="w-3 h-3 text-dark-gray" />}
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Anggota Tim</label>
                <div
                  onClick={() => setIsNewCatTeamDropdownOpen(!isNewCatTeamDropdownOpen)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate">
                    {newCatTeamMembers.length > 0 ? `${newCatTeamMembers.length} anggota dipilih` : '-- Pilih Anggota --'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-dark-gray/50" />
                </div>

                {isNewCatTeamDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-dark-gray/15 rounded-lg shadow-lg overflow-hidden max-h-48 flex flex-col">
                    <div className="p-2 border-b border-dark-gray/10 bg-slate-50 sticky top-0">
                      <input
                        type="text"
                        placeholder="Cari anggota..."
                        value={newCatTeamSearchQuery}
                        onChange={(e) => setNewCatTeamSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-[10px] font-medium border border-dark-gray/20 px-2 py-1.5 rounded bg-white outline-none"
                      />
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
                      {userProfiles
                        .filter(p => p.role === 'Auditor Ahli Pertama')
                        .filter(p => (p.full_name || p.email).toLowerCase().includes(newCatTeamSearchQuery.toLowerCase()))
                        .sort(byNipAge)
                        .map(p => {
                          const name = p.full_name || p.email;
                          const isSelected = newCatTeamMembers.includes(name);
                          return (
                            <div
                              key={p.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelected) {
                                  setNewCatTeamMembers(prev => prev.filter(n => n !== name));
                                } else {
                                  setNewCatTeamMembers(prev => [...prev, name]);
                                }
                              }}
                              className={`text-[10px] p-2 rounded cursor-pointer font-medium flex items-center justify-between ${
                                isSelected ? 'bg-peach-accent/20 text-dark-gray font-bold' : 'hover:bg-dark-gray/5 text-dark-gray/80'
                              }`}
                            >
                              <span>{name}</span>
                              {isSelected && <Check className="w-3 h-3 text-dark-gray" />}
                            </div>
                          );
                        })
                      }
                    </div>
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

      {/* Edit Category Team Modal */}
      {isEditingCategoryTeam && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-dark-gray/10 text-dark-gray">
            <div className="bg-dark-gray text-white rounded-t-2xl px-4 py-3 flex items-center justify-between">
              <span className="font-extrabold text-xs tracking-wide">Edit Tim Jenis Audit</span>
              <button onClick={() => setIsEditingCategoryTeam(false)} className="text-white/80 hover:text-white font-xs font-bold cursor-pointer">Tutup</button>
            </div>
            <form onSubmit={handleSaveCategoryTeam} className="p-4 space-y-3.5 text-xs">

              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Ketua Tim</label>
                <div
                  onClick={() => setIsEditCatAuditorDropdownOpen(!isEditCatAuditorDropdownOpen)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray cursor-pointer flex justify-between items-center"
                >
                  <span>{editCatAuditorName || '-- Pilih Ketua Tim --'}</span>
                  <ChevronDown className="w-4 h-4 text-dark-gray/50" />
                </div>

                {isEditCatAuditorDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-dark-gray/15 rounded-lg shadow-lg overflow-hidden max-h-48 flex flex-col">
                    <div className="p-2 border-b border-dark-gray/10 bg-slate-50 sticky top-0">
                      <input
                        type="text"
                        placeholder="Cari nama..."
                        value={editCatAuditorSearchQuery}
                        onChange={(e) => setEditCatAuditorSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-[10px] font-medium border border-dark-gray/20 px-2 py-1.5 rounded bg-white outline-none"
                      />
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
                      {userProfiles
                        .filter(p => KETUA_TIM_ROLES.includes(p.role) && (p.full_name || p.email).toLowerCase().includes(editCatAuditorSearchQuery.toLowerCase()))
                        .sort(byNipAge)
                        .map(p => {
                          const isSelected = editCatAuditorName === (p.full_name || p.email);
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setEditCatAuditorName(p.full_name || p.email);
                                setIsEditCatAuditorDropdownOpen(false);
                                setEditCatAuditorSearchQuery('');
                              }}
                              className={`text-[10px] p-2 rounded cursor-pointer font-medium flex items-center justify-between ${
                                isSelected ? 'bg-peach-accent/20 text-dark-gray font-bold' : 'hover:bg-dark-gray/5 text-dark-gray/80'
                              }`}
                            >
                              <span>{p.full_name || p.email}</span>
                              {isSelected && <Check className="w-3 h-3 text-dark-gray" />}
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Anggota Tim</label>
                <div
                  onClick={() => setIsEditCatTeamDropdownOpen(!isEditCatTeamDropdownOpen)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate">
                    {editCatTeamMembers.length > 0 ? `${editCatTeamMembers.length} anggota dipilih` : '-- Pilih Anggota --'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-dark-gray/50" />
                </div>

                {isEditCatTeamDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-dark-gray/15 rounded-lg shadow-lg overflow-hidden max-h-48 flex flex-col">
                    <div className="p-2 border-b border-dark-gray/10 bg-slate-50 sticky top-0">
                      <input
                        type="text"
                        placeholder="Cari anggota..."
                        value={editCatTeamSearchQuery}
                        onChange={(e) => setEditCatTeamSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-[10px] font-medium border border-dark-gray/20 px-2 py-1.5 rounded bg-white outline-none"
                      />
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
                      {userProfiles
                        .filter(p => p.role === 'Auditor Ahli Pertama')
                        .filter(p => (p.full_name || p.email).toLowerCase().includes(editCatTeamSearchQuery.toLowerCase()))
                        .sort(byNipAge)
                        .map(p => {
                          const name = p.full_name || p.email;
                          const isSelected = editCatTeamMembers.includes(name);
                          return (
                            <div
                              key={p.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelected) {
                                  setEditCatTeamMembers(prev => prev.filter(n => n !== name));
                                } else {
                                  setEditCatTeamMembers(prev => [...prev, name]);
                                }
                              }}
                              className={`text-[10px] p-2 rounded cursor-pointer font-medium flex items-center justify-between ${
                                isSelected ? 'bg-peach-accent/20 text-dark-gray font-bold' : 'hover:bg-dark-gray/5 text-dark-gray/80'
                              }`}
                            >
                              <span>{name}</span>
                              {isSelected && <Check className="w-3 h-3 text-dark-gray" />}
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Status</label>
                <select
                  value={editCatStatus}
                  onChange={e => setEditCatStatus(e.target.value as AuditStatus)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sedang Berjalan">Sedang Berjalan</option>
                  <option value="Direview">Direview</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-dark-gray/10">
                <button type="button" onClick={() => setIsEditingCategoryTeam(false)} className="flex-1 bg-white py-2 border border-dark-gray/15 rounded-lg font-bold text-dark-gray cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 bg-peach-accent border border-dark-gray/10 py-2 rounded-lg font-black text-dark-gray hover:opacity-90 cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
