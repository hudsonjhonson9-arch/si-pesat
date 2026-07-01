/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { OpdAudit, AuditCategory, AuditItem, AuditStatus, FindingStatus, AuditType, UserProfile, KKATemplate, AuditMilestone } from '../types';
import { uploadEvidenceFile, copyEvidenceFileFromUrl } from '../lib/googleDrive';
import { supabase } from '../lib/supabase';
import EvidencePanel from './EvidencePanel';
import CoverDocumentGenerator from './CoverDocumentGenerator';
import SuratTugasGenerator from './SuratTugasGenerator';
import NotaDinasGenerator from './NotaDinasGenerator';
import SPPDGenerator from './SPPDGenerator';
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
  ChevronDown,
  ShieldOff,
  Lock,
  FileText,
  GripVertical
} from 'lucide-react';

const KETUA_TIM_ROLES = [
  'Inspektur', 'Inspektur Pembantu',
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
  const [leftTab, setLeftTab] = useState<'categories' | 'schedule'>('categories');

  const milestones = useMemo<AuditMilestone[]>(() => {
    if (audit.schedule && audit.schedule.length > 0) {
      return audit.schedule;
    }
    const getFutureDate = (days: number) => {
      const d = new Date(audit.auditDate || new Date());
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };
    return [
      { id: 'milestone_2', name: 'Pelaksanaan / KKA', targetDate: getFutureDate(21), status: 'Belum Mulai', notes: 'Evaluasi dokumen pertanggungjawaban fisik' },
    ];
  }, [audit.schedule, audit.auditDate]);

  const handleUpdateSchedule = (updatedMilestones: AuditMilestone[]) => {
    onUpdates({
      ...audit,
      schedule: updatedMilestones
    });
  };


  const [uploadingIds, setUploadingIds] = useState<Record<string, boolean>>({});

  const handleDirectUpload = async (itemId: string, file: File, newName?: string) => {
    // Conflict Check
    const hasConflict = await checkConflict(itemId, 'Unggah dokumen');
    if (hasConflict) return;

    setUploadingIds(prev => ({ ...prev, [itemId]: true }));
    try {
      const fileToUpload = newName ? new File([file], newName, { type: file.type }) : file;
      const res = await uploadEvidenceFile(fileToUpload, audit.fiscalYear, audit.opdName, audit.auditType);
      // Find existing evidence history for this item
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
    
    // Conflict Check
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

  // Editing Category Team
  const [isEditingCategoryTeam, setIsEditingCategoryTeam] = useState(false);
  const [editCatAuditorName, setEditCatAuditorName] = useState('');
  const [editCatTeamMembers, setEditCatTeamMembers] = useState<string[]>([]);
  const [editCatFiscalYear, setEditCatFiscalYear] = useState('');
  const [editCatStatus, setEditCatStatus] = useState<AuditStatus>('Draft');
  const [isEditCatAuditorDropdownOpen, setIsEditCatAuditorDropdownOpen] = useState(false);
  const [editCatAuditorSearchQuery, setEditCatAuditorSearchQuery] = useState('');
  const [isEditCatTeamDropdownOpen, setIsEditCatTeamDropdownOpen] = useState(false);
  const [editCatTeamSearchQuery, setEditCatTeamSearchQuery] = useState('');

  // Editing School General Information
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metaSchoolName, setMetaSchoolName] = useState(audit.opdName);
  const [metaOpdType, setMetaOpdType] = useState<OpdAudit['opdType']>(audit.opdType || 'Dinas');
  const [metaAuditorName, setMetaAuditorName] = useState(audit.auditorName);
  const [metaStatus, setMetaStatus] = useState<AuditStatus>(audit.status);
  const [metaFiscalYear, setMetaFiscalYear] = useState(audit.fiscalYear);
  const [metaAuditType, setMetaAuditType] = useState<AuditType>(audit.auditType || 'Belum Diatur');
  const [metaTeamMembers, setMetaTeamMembers] = useState<string[]>(audit.teamMembers || []);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);

  // Cover Generator State
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isSuratTugasModalOpen, setIsSuratTugasModalOpen] = useState(false);
  const [isNotaDinasModalOpen, setIsNotaDinasModalOpen] = useState(false);
  const [isSPPDModalOpen, setIsSPPDModalOpen] = useState(false);

  // Find the currently selected category
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

  // Check if current user is a member of any category team (Auditor access control)
  // Struktural selalu punya akses penuh, tidak perlu dicek keanggotaan tim
  const isTeamMember = STRUKTURAL_ROLES.includes(userRole) || !FUNGSIONAL_ROLES.includes(userRole) || !currentUserName || audit.categories.some(cat => {
    const currNameLower = currentUserName.toLowerCase().trim();
    return (cat.auditorName || '').toLowerCase().trim() === currNameLower ||
           (cat.teamMembers || []).some(m => m.toLowerCase().trim() === currNameLower);
  });

  const isReadOnly = !isTeamMember ||
    (activeCategory?.status === 'Selesai' || audit.status === 'Selesai') ||
    (FUNGSIONAL_ROLES.includes(userRole) && activeCategory?.status === 'Direview');

  const isReviewerPanelVisible = STRUKTURAL_ROLES.includes(userRole);

  // Handle saving general metadata updates
  const handleSaveMetadata = () => {
    onUpdates({
      ...audit,
      opdName: metaSchoolName,
      opdType: metaOpdType,
      fiscalYear: metaFiscalYear
    });
    setIsEditingMetadata(false);
  };

  // Helper untuk mengecek konflik data sebelum melakukan aksi kritis
  const checkConflict = async (itemId: string, actionName: string = 'Perubahan'): Promise<boolean> => {
    if (!navigator.onLine) return false;
    if (isSyncing) return false; // Ignore checks if we are actively saving (prevents false positives on rapid clicking)

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
            
            // Seamlessly sync with the remote data instead of reloading the page
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

  // Quick state toggling for individual criteria items
  const handleItemStatusChange = async (itemId: string, status: FindingStatus) => {
    if (isReadOnly) return;

    // Conflict Check
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

  // Adding a new custom checklist item to the active category
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

  // Drag-reorder item
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

  // Delete checklist item
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


  // Remove a whole category dynamically (Requirement A.1)
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
    <div className="space-y-6 text-dark-gray" id="audit-workspace-view">
      {/* Back and Sync Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-baby-blue p-3 rounded-xl border border-dark-gray/10 shadow-xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-dark-gray hover:text-dark-gray/70 font-extrabold transition p-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </button>
      </div>

      {/* Access Denied Banner for Auditors not in any team */}
      {!isTeamMember && FUNGSIONAL_ROLES.includes(userRole) && (
        <div className="flex items-start gap-4 bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-2">
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
                  {STRUKTURAL_ROLES.includes(userRole) && (
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
                  </h2>
                  <p className="text-xs text-dark-gray/70 mt-0.5">Jenjang {audit.opdType} • Tahun Anggaran {audit.fiscalYear}</p>
                </div>

                <div className="pt-2 border-t border-dark-gray/10 space-y-1.5 text-xs font-semibold">
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Tipe Objek</label>
                    <select
                      value={metaOpdType}
                      onChange={e => setMetaOpdType(e.target.value as OpdAudit['opdType'])}
                      className="w-full text-xs border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray font-bold outline-none"
                    >
                      {['SD', 'SMP', 'Dinas', 'Badan', 'Kecamatan', 'Desa', 'Kelurahan', 'Puskesmas', 'Sekretariat Daerah', 'Lainnya'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
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

          {/* Tab Switcher for Sidebar */}
          <div className="flex gap-1.5 bg-dark-gray/5 p-1 rounded-xl border border-dark-gray/10">
            <button
              onClick={() => setLeftTab('categories')}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                leftTab === 'categories'
                  ? 'bg-dark-gray text-white shadow-xs'
                  : 'text-dark-gray/65 hover:text-dark-gray hover:bg-white/40'
              }`}
            >
              Kategori KKA
            </button>
            <button
              onClick={() => setLeftTab('schedule')}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                leftTab === 'schedule'
                  ? 'bg-dark-gray text-white shadow-xs'
                  : 'text-dark-gray/65 hover:text-dark-gray hover:bg-white/40'
              }`}
            >
              Jadwal & Progress
            </button>
          </div>

          {leftTab === 'categories' ? (
            /* Category/Instrument Navigation Controller with responsive list */
            <div className="bg-baby-blue rounded-xl border border-dark-gray/10 p-4 shadow-xs space-y-3 text-dark-gray">
              <div className="flex items-center justify-between pb-2 border-b border-dark-gray/10">
                <span className="text-[10px] font-bold text-dark-gray/60 uppercase tracking-wider block">Jenis Audit Pemeriksaan</span>
                {STRUKTURAL_ROLES.includes(userRole) && !isReadOnly && (
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
                      className={`group flex items-center justify-between text-xs p-2.5 rounded-lg cursor-pointer transition-all border ${isActive
                          ? 'bg-dark-gray border-transparent text-white shadow-xs font-bold'
                          : 'bg-white/40 border-dark-gray/5 text-dark-gray hover:bg-white/70 hover:text-dark-gray font-semibold'
                        }`}
                    >
                      <span className="truncate pr-1">{cat.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {temuanCount > 0 && (
                          <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-mono ${isActive ? 'bg-peach-accent text-dark-gray font-black' : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}>
                            {temuanCount}!
                          </span>
                        )}

                        {/* Delete category button */}
                        {STRUKTURAL_ROLES.includes(userRole) && !isReadOnly && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat.id);
                            }}
                            className={`opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-red-50 hover:text-red-600 border border-transparent ${isActive ? 'text-white/60 hover:bg-dark-gray/50 hover:text-white' : 'text-dark-gray/40'
                              }`}
                            title="Hapus Jenis Audit Pemeriksaan"
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
          ) : (
            /* Stepper milestone view */
            <div className="bg-baby-blue rounded-xl border border-dark-gray/10 p-4 shadow-xs space-y-4 text-dark-gray">
              <span className="text-[10px] font-bold text-dark-gray/60 uppercase tracking-wider block border-b border-dark-gray/10 pb-2">Status Timeline Jadwal</span>
              <div className="relative pl-6 space-y-5 border-l-2 border-slate-200 mt-2">
                {milestones.map((m) => {
                  const isSelesai = m.status === 'Selesai';
                  const isRunning = m.status === 'Sedang Berjalan';
                  return (
                    <div key={m.id} className="relative">
                      {/* Stepper Dot */}
                      <div className={`absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelesai ? 'bg-emerald-500 border-emerald-600 text-white' :
                        isRunning ? 'bg-blue-500 border-blue-600 text-white animate-pulse' :
                        'bg-white border-slate-300 text-slate-400'
                      }`}>
                        {isSelesai ? <span className="text-[8px] font-bold">✓</span> : <span className="text-[8px] font-bold">•</span>}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 leading-tight">{m.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {m.startDate && (
                            <span>{new Date(m.startDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })} → </span>
                          )}
                          <span className="font-mono">{m.targetDate ? new Date(m.targetDate).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}</span>
                          {m.startDate && m.targetDate && (() => {
                            const days = Math.floor((new Date(m.targetDate).getTime() - new Date(m.startDate).getTime()) / (1000*60*60*24));
                            return days > 0 ? <span className="ml-1 text-slate-400">({days} hari)</span> : null;
                          })()}
                        </div>
                        {m.actualDate && (
                          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                            Selesai: <span className="font-mono">{new Date(m.actualDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                          </div>
                        )}
                        <div className="mt-1">
                          <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase ${
                            isSelesai ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            isRunning ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Active Category Items List */}
        <div className="lg:col-span-8 space-y-4">
          {leftTab === 'schedule' ? (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-dark-gray/10 p-6 shadow-sm space-y-6 text-dark-gray">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    📅 Jadwal & Monitoring Pengerjaan Audit
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Atur tanggal target, realisasi pengerjaan, status tahapan, serta catatan pemantauan audit untuk audit ini.
                  </p>
                </div>
                
                <div className="divide-y divide-slate-150 space-y-5">
                  {milestones.map((m, index) => (
                    <div key={m.id} className="pt-5 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <div className="md:col-span-3">
                        <div className="font-bold text-xs text-slate-700">{m.name}</div>
                      </div>
                      
                      <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Tanggal Mulai</label>
                          <input
                            type="date"
                             disabled={isReadOnly || !FUNGSIONAL_ROLES.includes(userRole)}
                             value={m.startDate || ''}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[index] = { ...m, startDate: e.target.value || undefined };
                              handleUpdateSchedule(updated);
                            }}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none text-slate-700"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Tanggal Selesai</label>
                          <input
                            type="date"
                            disabled={isReadOnly || !FUNGSIONAL_ROLES.includes(userRole)}
                            value={m.targetDate}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[index] = { ...m, targetDate: e.target.value };
                              handleUpdateSchedule(updated);
                            }}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none text-slate-700"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Tanggal Realisasi</label>
                          <input
                            type="date"
                            disabled={isReadOnly || !FUNGSIONAL_ROLES.includes(userRole)}
                            value={m.actualDate || ''}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[index] = { ...m, actualDate: e.target.value || undefined };
                              handleUpdateSchedule(updated);
                            }}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none text-slate-700"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Status Tahap</label>
                          <select
                            disabled={isReadOnly || !FUNGSIONAL_ROLES.includes(userRole)}
                            value={m.status}
                            onChange={(e) => {
                              const updated = [...milestones];
                              const newStatus = e.target.value as any;
                              updated[index] = { 
                                ...m, 
                                status: newStatus,
                                actualDate: newStatus === 'Selesai' && !m.actualDate ? new Date().toISOString().split('T')[0] : m.actualDate
                              };
                              handleUpdateSchedule(updated);
                            }}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-slate-50 focus:bg-white outline-none text-slate-700"
                          >
                            <option value="Belum Mulai">Belum Mulai</option>
                            <option value="Sedang Berjalan">Sedang Berjalan</option>
                            <option value="Selesai">Selesai</option>
                          </select>
                        </div>
                        
                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Catatan Pemantauan</label>
                          <input
                            type="text"
                            disabled={isReadOnly || !FUNGSIONAL_ROLES.includes(userRole)}
                            placeholder="Tulis progres atau hambatan pengerjaan..."
                            value={m.notes || ''}
                            onChange={(e) => {
                              const updated = [...milestones];
                              updated[index] = { ...m, notes: e.target.value };
                              handleUpdateSchedule(updated);
                            }}
                            className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none text-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {!isReadOnly && FUNGSIONAL_ROLES.includes(userRole) && (
                  <div className="pt-4 border-t border-slate-150 flex justify-end">
                    <button
                      onClick={() => {
                        onSync(audit);
                        onShowToast?.('Berhasil menyimpan dan mensinkronkan jadwal pengerjaan audit!', 'success');
                      }}
                      className="px-4 py-2 bg-peach-accent text-dark-gray text-xs font-black rounded-xl hover:opacity-90 transition border border-dark-gray/10 shadow-sm cursor-pointer"
                    >
                      Simpan & Sinkronkan Jadwal
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Active Category Header Card */}
          {activeCategory && (
            <div className="bg-dark-gray text-white rounded-xl p-5 border border-white/5 shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold tracking-tight text-white leading-tight flex items-center gap-2">
                    {activeCategory.name}
                    {(currentUserName === activeCategory.auditorName || STRUKTURAL_ROLES.includes(userRole)) && (
                      <button onClick={openEditCategoryTeam} className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors" title="Edit Tim & Tahun Jenis Audit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed max-w-2xl">
                    {activeCategory.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider ${
                        activeCategory.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        activeCategory.status === 'Direview' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        activeCategory.status === 'Sedang Berjalan' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {activeCategory.status || 'Draft'}
                      </span>
                    </div>
                    <div className="text-[10px] text-white/60 font-bold uppercase tracking-wide">Ketua Tim: <span className="text-white font-normal">{activeCategory.auditorName || 'Belum diatur'}</span></div>
                    <div className="text-[10px] text-white/60 font-bold uppercase tracking-wide">Anggota Tim: <span className="text-white font-normal">{activeCategory.teamMembers && activeCategory.teamMembers.length > 0 ? activeCategory.teamMembers.join(', ') : 'Belum diatur'}</span></div>
                    
                    {/* Per-Category Action Buttons */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 border border-white/10 p-1 rounded-lg bg-white/5">
                        <button 
                          onClick={() => setIsCoverModalOpen(true)}
                          className="inline-flex items-center gap-1.5 text-[10px] bg-white border border-dark-gray/15 hover:bg-slate-50 text-dark-gray font-extrabold px-2 py-1 rounded-md shadow-xs transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-peach-accent" />
                          Sampul
                        </button>
                        <button 
                          onClick={() => setIsNotaDinasModalOpen(true)}
                          className="inline-flex items-center gap-1.5 text-[10px] bg-white border border-dark-gray/15 hover:bg-slate-50 text-dark-gray font-extrabold px-2 py-1 rounded-md shadow-xs transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          Nota Dinas
                        </button>
                        <button 
                          onClick={() => setIsSuratTugasModalOpen(true)}
                          className="inline-flex items-center gap-1.5 text-[10px] bg-white border border-dark-gray/15 hover:bg-slate-50 text-dark-gray font-extrabold px-2 py-1 rounded-md shadow-xs transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          Surat Tugas
                        </button>
                        <button 
                          onClick={() => setIsSPPDModalOpen(true)}
                          className="inline-flex items-center gap-1.5 text-[10px] bg-white border border-dark-gray/15 hover:bg-slate-50 text-dark-gray font-extrabold px-2 py-1 rounded-md shadow-xs transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          SPPD
                        </button>
                      </div>
                      
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
                          className="text-[10px] px-2 py-1 rounded-md font-extrabold inline-flex items-center gap-1 transition-all cursor-pointer border bg-blue-500 text-white border-blue-600 hover:bg-blue-600 shadow-xs"
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
                            className="text-[10px] px-2 py-1 rounded-md font-extrabold inline-flex items-center gap-1 transition-all cursor-pointer border bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Setujui
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
                            className="text-[10px] px-2 py-1 rounded-md font-extrabold inline-flex items-center gap-1 transition-all cursor-pointer border bg-rose-500 text-white border-rose-600 hover:bg-rose-600 shadow-xs"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> Kembalikan Revisi
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Category stats badges (Mobile friendly flex block) */}
                <span className="text-[10px] bg-white/10 border border-white/10 px-2 py-1 rounded font-mono text-white/90 flex-shrink-0 font-bold uppercase">
                  {categoryStats.totItems} Dokumen
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
            <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-dark-gray/75 uppercase tracking-wider">Spesifikasi Bukti & Pertanggungjawaban</span>
                {FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && (
                  <button
                    onClick={() => { setIsAddingItem(true); setSearchQuery(''); }}
                    className="text-[10px] font-extrabold text-white bg-dark-gray hover:bg-dark-gray/80 px-2 py-1 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Item
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-dark-gray/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari spesifikasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-dark-gray/20 rounded-lg text-sm w-full sm:w-64 focus:ring-1 focus:ring-slate-800 focus:border-slate-800 transition-colors bg-white/50"
                />
              </div>
            </div>

            {/* Inline form for adding new item */}
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
                  <button
                    type="submit"
                    className="text-[10px] font-extrabold bg-dark-gray text-white px-3 py-1.5 rounded-lg hover:bg-dark-gray/80 transition cursor-pointer"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingItem(false); setNewItemTitle(''); setNewItemDescription(''); }}
                    className="text-[10px] font-bold text-dark-gray/70 hover:text-dark-gray px-3 py-1.5 rounded-lg border border-dark-gray/20 hover:bg-dark-gray/5 transition cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {/* Checklists items */}
            {filteredItems.map((item, idx) => {
              const hasFinding = item.status === 'Temuan';
              return (
                <div
                  key={item.id}
                  draggable={FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && !searchQuery.trim()}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  className={`bg-baby-blue rounded-xl border border-dark-gray/10 p-4 transition-all shadow-xs text-dark-gray ${hasFinding ? 'border-l-4 border-l-rose-500 bg-rose-400/10' : ''
                    } ${FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && !searchQuery.trim() ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

                    {/* Title and Descriptions */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && !searchQuery.trim() && (
                          <span className="text-dark-gray/30 hover:text-dark-gray/60 cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-4 h-4" />
                          </span>
                        )}
                        <span className="text-[10px] font-mono select-none px-2 py-0.5 rounded bg-white/40 text-dark-gray/70 font-bold">
                          Dokumen {idx + 1}
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
                        className={`text-[10px] font-black px-3 py-1.5 rounded-md transition-all ${!isReadOnly && 'cursor-pointer'} ${item.status === 'Sesuai'
                            ? 'bg-emerald-600 text-white shadow-md scale-105'
                            : `bg-emerald-50 text-emerald-700/70 border border-emerald-200/50 ${!isReadOnly && 'hover:bg-emerald-100 hover:text-emerald-800'}`
                          } ${isReadOnly && 'opacity-70'}`}
                      >
                        Sesuai
                      </button>
                      <button
                        disabled={isReadOnly}
                        onClick={() => handleItemStatusChange(item.id, 'Temuan')}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-md transition-all ${!isReadOnly && 'cursor-pointer'} ${item.status === 'Temuan'
                            ? 'bg-rose-600 text-white shadow-md scale-105'
                            : `bg-rose-50 text-rose-700/70 border border-rose-200/50 ${!isReadOnly && 'hover:bg-rose-100 hover:text-rose-800'}`
                          } ${isReadOnly && 'opacity-70'}`}
                      >
                        Temuan
                      </button>
                      <button
                        disabled={isReadOnly}
                        onClick={() => handleItemStatusChange(item.id, 'N/A')}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-md transition-all ${!isReadOnly && 'cursor-pointer'} ${item.status === 'N/A'
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
                          <input
                            type="text"
                            list={`klasifikasi-options-${item.id}`}
                            disabled={isReadOnly || !FUNGSIONAL_ROLES.includes(userRole)}
                            value={item.jenisTemuan || ''}
                            onChange={e => handleFindingDetailChange(item.id, 'jenisTemuan', e.target.value)}
                            placeholder="Ketik klasifikasi temuan..."
                            className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white shadow-xs disabled:bg-white/40 disabled:cursor-not-allowed outline-none text-dark-gray"
                          />
                          <datalist id={`klasifikasi-options-${item.id}`}>
                            <option value="Kelebihan Pembayaran (Overpayment)" />
                            <option value="Belanja Fiktif (Manipulasi / Kwitansi Palsu)" />
                            <option value="Pemborosan (Inefisiensi Anggaran)" />
                            <option value="Pajak Belum Disetor ke Kas Negara" />
                            <option value="Penggunaan Dana Tidak Sesuai Juknis BOS" />
                            <option value="Lain-lain / Administrasi Kurang Lengkap" />
                          </datalist>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide block">Nilai Temuan Keuangan (IDR)</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-dark-gray/50 font-mono font-bold pointer-events-none">
                              Rp
                            </span>
                            <input
                              disabled={isReadOnly || !FUNGSIONAL_ROLES.includes(userRole)}
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
                            disabled={isReadOnly || !FUNGSIONAL_ROLES.includes(userRole)}
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
                            disabled={isReadOnly || !FUNGSIONAL_ROLES.includes(userRole)}
                            placeholder="Rekomendasi tindakan hukum/administratif, pengembalian kas, atau peneguran tertulis..."
                            value={item.rekomendasi || ''}
                            onChange={e => handleFindingDetailChange(item.id, 'rekomendasi', e.target.value)}
                            rows={2}
                            className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white/70 focus:bg-white resize-none disabled:bg-white/40 disabled:cursor-not-allowed outline-none text-dark-gray"
                          />
                        </div>
                      </div>

                      {/* Delete action button for item */}
                      {FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && (
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
                  {/* SPESIFIKASI BUKTI - delegated to EvidencePanel */}
                  <EvidencePanel
                    evidenceLink={item.evidenceLink}
                    evidenceName={item.evidenceName}
                    evidenceHistory={item.evidenceHistory || []}
                    isReadOnly={isReadOnly}
                    isAuditor={FUNGSIONAL_ROLES.includes(userRole)}
                    isUploading={!!uploadingIds[item.id]}
                    isCopying={!!copyingIds[item.id]}
                    onUploadFile={async (file, newName) => handleDirectUpload(item.id, file, newName)}
                    onCopyFromUrl={async (url, name) => handleDirectCopy(item.id, url, name)}
                    onChangeLink={(link) => handleFindingDetailChange(item.id, 'evidenceLink', link)}
                    onChangeName={(name) => handleFindingDetailChange(item.id, 'evidenceName', name)}
                    onClear={async () => {
                      // Conflict Check
                      const hasConflict = await checkConflict(item.id, 'Hapus dokumen');
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
                    onAddHistory={(action, name, link) => {
                      const prevHistory = item.evidenceHistory || [];
                      const historyEntry = {
                        name,
                        link,
                        uploadedAt: new Date().toISOString(),
                        uploadedBy: currentUserName || audit.auditorName || 'Auditor',
                        action
                      };
                      handleFindingDetailsUpdate(item.id, {
                        evidenceHistory: [...prevHistory, historyEntry]
                      });
                    }}
                  />

                  {/* CATATAN REVIEW / EVALUASI (Inspektur Pembantu / Inspektur) */}
                  <div className="mt-3.5 bg-amber-100/45 border border-amber-200/50 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-950 text-[10px] tracking-tight uppercase flex items-center gap-1">
                        ✍️ Catatan Review Pengendalian Mutu (Pimpinan)
                      </span>
                      {item.catatanReview && (
                        <span className="text-[9px] bg-amber-200 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-mono uppercase font-black">
                          Ditanggapi
                        </span>
                      )}
                    </div>

                    {STRUKTURAL_ROLES.includes(userRole) && (item.status === 'Temuan' || item.status === 'Sesuai') && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 flex items-start gap-2 mt-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-800 font-semibold leading-relaxed">
                          Status saat ini: <strong className="uppercase">{item.status}</strong>. 
                          Pemberitahuan: Jika Anda memberikan review atau mengubah status, pastikan untuk berkoordinasi dengan Auditor untuk menghindari konflik pembaruan data.
                        </p>
                      </div>
                    )}

                    {FUNGSIONAL_ROLES.includes(userRole) || (isReadOnly && audit.status === 'Selesai') ? (
                      <p className="text-[11px] text-amber-900 bg-white/20 p-2 border border-amber-200/40 rounded italic font-bold leading-relaxed">
                        {item.catatanReview || 'Belum ada catatan review dari pimpinan.'}
                      </p>
                    ) : (
                      <div className="space-y-1.5 mt-2">
                        <textarea
                          placeholder="Tulis ulasan review, koreksi bukti SPESIFIKASI, arahan revisi angka temuan, atau persetujuan di sini..."
                          value={item.catatanReview || ''}
                          onChange={(e) => handleFindingDetailChange(item.id, 'catatanReview', e.target.value)}
                          onBlur={async () => {
                            // Conflict check on blur for review notes
                            if (!navigator.onLine || !item.catatanReview) return;
                            try {
                              const { data } = await supabase.from('audits').select('categories').eq('id', audit.id).single();
                              if (data && data.categories) {
                                const remoteItem = data.categories.flatMap((c: any) => c.items).find((i: any) => i.id === item.id);
                                if (remoteItem && remoteItem.catatanReview && remoteItem.catatanReview !== item.catatanReview && item.catatanReview.length < remoteItem.catatanReview.length) {
                                   alert('Peringatan: Pengguna lain mungkin telah memodifikasi catatan ini.');
                                }
                              }
                            } catch (err) {}
                          }}
                          rows={3}
                          className="w-full min-h-[70px] text-xs font-bold border border-amber-200/50 p-2.5 rounded-lg bg-white/80 focus:bg-white outline-none text-dark-gray shadow-xs"
                        />
                        <p className="text-[9.5px] text-amber-900/80 italic font-mono font-bold">Tersimpan otomatis sebagai rancangan ulasan review pimpinan ({userRole}).</p>
                      </div>
                    )}
                  </div>

                  {/* Fallback delete button if NOT currently expanded */}
                  {!hasFinding && FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && (
                    <div className="mt-2.5 pt-2 border-t border-dark-gray/10 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-[10px] text-rose-700 hover:text-rose-950 font-bold inline-flex items-center gap-0.5 cursor-pointer bg-white/40 border border-dark-gray/10 px-2 py-0.5 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Dokumen
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </>
          )}
        </div>
      </div>

      {/* Add Custom Category Popup Form */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-dark-gray/10 text-dark-gray">
            <div className="bg-dark-gray text-white px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <span className="font-extrabold text-xs tracking-wide">Tambah Jenis Audit Pemeriksaan Baru (A.1)</span>
              <button onClick={() => setIsAddingCategory(false)} className="text-white/80 hover:text-white font-xs font-bold cursor-pointer">Tutup</button>
            </div>
            <form onSubmit={handleAddCategory} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Pilih Jenis Audit Pemeriksaan</label>
                {availableMasterCategories.length > 0 ? (
                  <select
                    value={selectedMasterCatId}
                    onChange={e => setSelectedMasterCatId(e.target.value)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-none focus:border-peach-accent"
                    required
                  >
                    <option value="" disabled>-- Pilih Jenis Audit Pemeriksaan --</option>
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
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Nama Auditor Utama (Ketua Tim)</label>
                <div 
                  onClick={() => setIsNewCatAuditorDropdownOpen(!isNewCatAuditorDropdownOpen)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-hidden focus:border-peach-accent cursor-pointer flex justify-between items-center"
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
                        className="w-full text-[10px] font-medium border border-dark-gray/20 px-2 py-1.5 rounded bg-white focus:outline-hidden focus:border-peach-accent"
                      />
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
                      {userProfiles
                        .filter(p => KETUA_TIM_ROLES.includes(p.role) && (p.full_name || p.email).toLowerCase().includes(newCatAuditorSearchQuery.toLowerCase()))
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
                      {userProfiles.filter(p => (p.full_name || p.email).toLowerCase().includes(newCatAuditorSearchQuery.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-[10px] text-dark-gray/50 italic text-center">Tidak ditemukan</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Anggota Tim (Pilih Beberapa)</label>
                <div 
                  onClick={() => setIsNewCatTeamDropdownOpen(!isNewCatTeamDropdownOpen)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-hidden focus:border-peach-accent cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate">
                    {newCatTeamMembers.length > 0 
                      ? `${newCatTeamMembers.length} anggota dipilih`
                      : '-- Pilih Anggota --'}
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
                        className="w-full text-[10px] font-medium border border-dark-gray/20 px-2 py-1.5 rounded bg-white focus:outline-hidden focus:border-peach-accent"
                      />
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
                      {userProfiles
                        .filter(p => p.role === 'Auditor Ahli Pertama')
                        .filter(p => (p.full_name || p.email).toLowerCase().includes(newCatTeamSearchQuery.toLowerCase()))
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
                      {userProfiles.filter(p => p.role === 'Auditor Ahli Pertama').filter(p => (p.full_name || p.email).toLowerCase().includes(newCatTeamSearchQuery.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-[10px] text-dark-gray/50 italic text-center">Tidak ditemukan</div>
                      )}
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
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Nama Auditor Utama (Ketua Tim)</label>
                <div 
                  onClick={() => setIsEditCatAuditorDropdownOpen(!isEditCatAuditorDropdownOpen)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-hidden focus:border-peach-accent cursor-pointer flex justify-between items-center"
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
                        className="w-full text-[10px] font-medium border border-dark-gray/20 px-2 py-1.5 rounded bg-white focus:outline-hidden focus:border-peach-accent"
                      />
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
                      {userProfiles
                        .filter(p => KETUA_TIM_ROLES.includes(p.role) && (p.full_name || p.email).toLowerCase().includes(editCatAuditorSearchQuery.toLowerCase()))
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
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Anggota Tim (Pilih Beberapa)</label>
                <div 
                  onClick={() => setIsEditCatTeamDropdownOpen(!isEditCatTeamDropdownOpen)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-hidden focus:border-peach-accent cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate">
                    {editCatTeamMembers.length > 0 
                      ? `${editCatTeamMembers.length} anggota dipilih`
                      : '-- Pilih Anggota --'}
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
                        className="w-full text-[10px] font-medium border border-dark-gray/20 px-2 py-1.5 rounded bg-white focus:outline-hidden focus:border-peach-accent"
                      />
                    </div>
                    <div className="overflow-y-auto overflow-x-hidden p-1 space-y-0.5">
                      {userProfiles
                        .filter(p => p.role === 'Auditor Ahli Pertama')
                        .filter(p => (p.full_name || p.email).toLowerCase().includes(editCatTeamSearchQuery.toLowerCase()))
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
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Status Jenis Audit</label>
                <select
                  value={editCatStatus}
                  onChange={e => setEditCatStatus(e.target.value as AuditStatus)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray focus:outline-hidden focus:border-peach-accent"
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

      {/* Cover Document Generator Modal */}
      {isCoverModalOpen && (
        <CoverDocumentGenerator 
          audit={audit} 
          activeCategory={activeCategory} 
          userProfiles={userProfiles}
          onClose={() => setIsCoverModalOpen(false)} 
          onSaveAsDokumen1={handleSaveCoverToDokumen1}
        />
      )}

      {isSuratTugasModalOpen && (
        <SuratTugasGenerator 
          audit={audit} 
          activeCategory={activeCategory} 
          userProfiles={userProfiles}
          onClose={() => setIsSuratTugasModalOpen(false)} 
        />
      )}

      {isNotaDinasModalOpen && (
        <NotaDinasGenerator 
          audit={audit} 
          activeCategory={activeCategory} 
          userProfiles={userProfiles}
          onClose={() => setIsNotaDinasModalOpen(false)} 
        />
      )}

      {isSPPDModalOpen && (
        <SPPDGenerator 
          audit={audit} 
          activeCategory={activeCategory} 
          userProfiles={userProfiles}
          onClose={() => setIsSPPDModalOpen(false)} 
        />
      )}
    </div>
  );
}
