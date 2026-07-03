import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Reorder, useDragControls, AnimatePresence, motion } from 'motion/react';
import { OpdAudit, AuditCategory, AuditItem, AuditStatus, UserProfile, KKATemplate, AuditMilestone } from '../types';
import { uploadEvidenceFile, copyEvidenceFileFromUrl, uploadFolderFiles } from '../lib/googleDrive';
import { toDisplay, fromDisplay } from '../lib/formatDate';
import { getWorkingDays } from '../lib/workingDays';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/log';
import EvidencePanel from './EvidencePanel';
import CoverDocumentGenerator from './CoverDocumentGenerator';
import SuratTugasGenerator from './SuratTugasGenerator';
import NotaDinasGenerator from './NotaDinasGenerator';
import SPPDGenerator from './SPPDGenerator';
import {
  Plus, Trash2, Check, ChevronDown, ShieldOff, Lock, FileText, Edit2, Calendar, GripVertical
} from 'lucide-react';

const byNipAge = (a: UserProfile, b: UserProfile) => {
  if (a.nip && b.nip) return a.nip.localeCompare(b.nip);
  if (a.nip) return -1;
  if (b.nip) return 1;
  return (a.full_name || '').localeCompare(b.full_name || '');
};

const STRUKTURAL_ROLES = ['Inspektur', 'Sekretaris', 'Inspektur Pembantu'];

const KETUA_TIM_ROLES = [
  'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];

const ANGGOTA_TIM_ROLES = [
  'Auditor Ahli Pertama',
  'PPUPD Ahli Pertama',
];

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

  const auditRef = useRef(audit);
  auditRef.current = audit;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialCategoryId || (audit.categories.length > 0 ? audit.categories[0].id : '')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const itemsListRef = useRef<HTMLDivElement>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const autoScrollSpeedRef = useRef<number>(0);

  const [uploadingIds, setUploadingIds] = useState<Record<string, boolean>>({});
  const [copyingIds, setCopyingIds] = useState<Record<string, boolean>>({});

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [selectedMasterCatId, setSelectedMasterCatId] = useState('');
  const [newCatAuditorName, setNewCatAuditorName] = useState('');
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

  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metaSchoolName, setMetaSchoolName] = useState(audit.opdName);
  const [metaOpdType, setMetaOpdType] = useState<OpdAudit['opdType']>(audit.opdType || 'Dinas');
  const [metaFiscalYear, setMetaFiscalYear] = useState(audit.fiscalYear);

  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isSuratTugasModalOpen, setIsSuratTugasModalOpen] = useState(false);
  const [isNotaDinasModalOpen, setIsNotaDinasModalOpen] = useState(false);
  const [isSPPDModalOpen, setIsSPPDModalOpen] = useState(false);

  const milestones = useMemo<AuditMilestone[]>(() => {
    const data = (audit.schedule && audit.schedule.length > 0) ? audit.schedule : [];
    if (data.length === 0) {
      const getFutureDate = (days: number) => {
        const d = new Date(audit.auditDate || new Date());
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
      };
      return [
        { id: 'milestone_2', name: 'Pelaksanaan Audit', startDate: getFutureDate(0), targetDate: getFutureDate(14), notes: '' },
      ];
    }
    return data.filter(m => m.id === 'milestone_2').map(m => ({
      ...m,
      name: m.name === 'Pelaksanaan / KKA' ? 'Pelaksanaan Audit' : m.name,
    }));
  }, [audit.schedule, audit.auditDate]);

  const handleUpdateSchedule = (updatedMilestones: AuditMilestone[]) => {
    onUpdates({ ...audit, schedule: updatedMilestones });
  };

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDirectUpload = async (itemId: string, file: File, newName?: string) => {
    if (!isTeamMember) { onShowToast?.('Hanya anggota tim yang dapat mengunggah dokumen.', 'error'); return; }
    const hasConflict = await checkConflict(itemId, 'Unggah dokumen');
    if (hasConflict) return;
    setUploadingIds(prev => ({ ...prev, [itemId]: true }));
    try {
      const fileToUpload = newName ? new File([file], newName, { type: file.type }) : file;
      const res = await uploadEvidenceFile(fileToUpload, audit.fiscalYear, audit.opdName, audit.auditType);
      const existingItem = auditRef.current.categories.flatMap(c => c.items).find(i => i.id === itemId);
      const prevHistory = existingItem?.evidenceHistory || [];
      const historyEntry = { name: res.name, link: res.webViewLink, uploadedAt: new Date().toISOString(), uploadedBy: currentUserName || audit.auditorName || 'Auditor', action: 'diunggah' as const };
      handleFindingDetailsUpdate(itemId, {
        evidenceFiles: [...(existingItem?.evidenceFiles || []), {
          id: crypto.randomUUID?.() || `ev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: res.name,
          link: res.webViewLink,
          relativePath: res.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUserName || audit.auditorName || 'Auditor',
          size: 0
        }],
        evidenceHistory: [...prevHistory, historyEntry]
      });
      onShowToast?.(`Berkas "${res.name}" berhasil diunggah.`, 'success');
      logActivity('upload_document', 'audit_item', audit.opdName, { fileName: res.name, category: audit.categories.find(c => c.items.some(i => i.id === itemId))?.name });
    } catch (err: any) {
      console.error(err);
      onShowToast?.(`Gagal mengunggah: ${err.message || err}`, 'error');
    } finally {
      setUploadingIds(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleDirectCopy = async (itemId: string, sourceUrl: string, currentName: string) => {
    if (!isTeamMember) { onShowToast?.('Hanya anggota tim yang dapat menautkan dokumen.', 'error'); return; }
    if (!sourceUrl || !sourceUrl.includes('drive.google.com')) return;
    const hasConflict = await checkConflict(itemId, 'Tautkan dokumen');
    if (hasConflict) return;
    setCopyingIds(prev => ({ ...prev, [itemId]: true }));
    try {
      const res = await copyEvidenceFileFromUrl(sourceUrl, currentName || `Copy_of_${itemId}`, audit.fiscalYear, audit.opdName, audit.auditType);
      const existingItem = auditRef.current.categories.flatMap(c => c.items).find(i => i.id === itemId);
      const prevHistory = existingItem?.evidenceHistory || [];
      const historyEntry = { name: res.name, link: res.webViewLink, uploadedAt: new Date().toISOString(), uploadedBy: currentUserName || audit.auditorName || 'Auditor', action: 'ditautkan' as const };
      handleFindingDetailsUpdate(itemId, {
        evidenceFiles: [...(existingItem?.evidenceFiles || []), {
          id: crypto.randomUUID?.() || `ev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: res.name,
          link: res.webViewLink,
          relativePath: res.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUserName || audit.auditorName || 'Auditor',
          size: 0
        }],
        evidenceHistory: [...prevHistory, historyEntry]
      });
      onShowToast?.('Berkas dari tautan berhasil disalin.', 'success');
      logActivity('link_document', 'audit_item', audit.opdName, { fileName: res.name, category: audit.categories.find(c => c.items.some(i => i.id === itemId))?.name });
    } catch (err: any) {
      console.error(err);
      onShowToast?.(`Gagal menyalin tautan: ${err.message || err}`, 'error');
    } finally {
      setCopyingIds(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleFolderUpload = async (itemId: string, files: File[], onProgress?: (done: number, total: number) => void) => {
    if (!isTeamMember) { onShowToast?.('Hanya anggota tim yang dapat mengunggah dokumen.', 'error'); return; }
    setUploadingIds(prev => ({ ...prev, [itemId]: true }));
    let results: any[] = [];
    try {
      results = await uploadFolderFiles(files, {
        fiscalYear: audit.fiscalYear,
        opdName: audit.opdName,
        auditType: audit.auditType,
        uploadedBy: currentUserName || audit.auditorName || 'Auditor'
      }, (done, total) => onProgress?.(done, total));
    } catch (err: any) {
      onShowToast?.(err.message, 'error');
    }
    if (results.length > 0) {
      const item = auditRef.current.categories.flatMap(c => c.items).find(i => i.id === itemId);
      if (item) {
        handleFindingDetailsUpdate(itemId, {
          evidenceFiles: [...(item.evidenceFiles || []), ...results],
          evidenceHistory: [
            ...(item.evidenceHistory || []),
            ...results.map(r => ({ name: r.name, link: r.link, uploadedAt: r.uploadedAt, uploadedBy: r.uploadedBy, action: 'diunggah' as const }))
          ]
        });
        logActivity('upload_folder', 'audit_item', audit.opdName, { fileCount: results.length, category: audit.categories.find(c => c.items.some(i => i.id === itemId))?.name });
      }
    }
    setUploadingIds(prev => ({ ...prev, [itemId]: false }));
  };

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
          const hasEvidenceConflict =
            JSON.stringify(remoteItem.evidenceFiles) !== JSON.stringify(localItem.evidenceFiles) ||
            remoteItem.evidenceLink !== localItem.evidenceLink ||
            (remoteItem.evidenceHistory?.length || 0) !== (localItem.evidenceHistory?.length || 0);
          if (hasStatusConflict || hasEvidenceConflict) {
            onShowToast?.(`${actionName} ditolak. Data telah dimodifikasi pengguna lain.`, 'error');
            onUpdates({ ...audit, categories: data.categories });
            return true;
          }
        }
      }
    } catch (err) { console.error('Failed to check conflict', err); }
    return false;
  };

  const handleDeleteEvidenceFile = async (itemId: string, fileId: string) => {
    const hasConflict = await checkConflict(itemId, 'Hapus dokumen');
    if (hasConflict) return;
    const item = auditRef.current.categories.flatMap(c => c.items).find(i => i.id === itemId);
    if (!item) return;
    const remaining = (item.evidenceFiles || []).filter(ef => ef.id !== fileId);
    const removed = (item.evidenceFiles || []).find(ef => ef.id === fileId);
    handleFindingDetailsUpdate(itemId, {
      evidenceFiles: remaining,
      evidenceHistory: [
        ...(item.evidenceHistory || []),
        ...(removed ? [{ name: removed.name, link: removed.link, uploadedAt: new Date().toISOString(), uploadedBy: currentUserName || audit.auditorName || 'Auditor', action: 'dihapus' as const }] : [])
      ]
    });
    logActivity('delete_document', 'audit_item', audit.opdName, { fileName: removed?.name, category: audit.categories.find(c => c.items.some(i => i.id === itemId))?.name });
    onShowToast?.('Dokumen dihapus.', 'info');
  };

  const handleFindingDetailChange = (itemId: string, field: keyof AuditItem, value: any) => {
    if (isReadOnly) return;
    const updatedCategories = audit.categories.map(cat => ({ ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) }));
    onUpdates({ ...audit, categories: updatedCategories });
  };

  const handleFindingDetailsUpdate = (itemId: string, updates: Partial<AuditItem>) => {
    if (isReadOnly && !('catatanReview' in updates)) return;
    const a = auditRef.current;
    const updatedCategories = a.categories.map(cat => ({ ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, ...updates } : item) }));
    const next = { ...a, categories: updatedCategories };
    auditRef.current = next;
    onUpdates(next);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !activeCategory) return;
    const newItem: AuditItem = { id: `item_temp_${Date.now()}`, title: newItemTitle.trim(), description: newItemDescription.trim(), status: 'N/A', nilaiTemuan: 0, uraianTemuan: '', rekomendasi: '' };
    const updatedCategories = audit.categories.map(cat => cat.id === activeCategory.id ? { ...cat, items: [...cat.items, newItem] } : cat);
    onUpdates({ ...audit, categories: updatedCategories });
    logActivity('add_item', 'audit_item', audit.opdName, { itemName: newItemTitle.trim(), category: activeCategory.name });
    setNewItemTitle(''); setNewItemDescription(''); setIsAddingItem(false);
  };

  // Called live while an item is being dragged (Framer Motion Reorder.Item onDrag)
  const handleItemDrag = useCallback((_event: any, info: { point: { x: number; y: number } }) => {
    const pageY = info?.point?.y;
    if (pageY == null) return;
    const clientY = pageY - window.scrollY;
    const ZONE = 70;
    const MAX_SPEED = 8;
    const viewportH = window.innerHeight;

    let speed = 0;
    if (clientY < ZONE) speed = -MAX_SPEED * (1 - clientY / ZONE);
    else if (viewportH - clientY < ZONE) speed = MAX_SPEED * (1 - (viewportH - clientY) / ZONE);

    autoScrollSpeedRef.current = speed;

    if (speed !== 0 && autoScrollRafRef.current === null) {
      const step = () => {
        window.scrollBy(0, autoScrollSpeedRef.current);
        if (autoScrollSpeedRef.current !== 0) {
          autoScrollRafRef.current = requestAnimationFrame(step);
        } else {
          autoScrollRafRef.current = null;
        }
      };
      autoScrollRafRef.current = requestAnimationFrame(step);
    } else if (speed === 0 && autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    autoScrollSpeedRef.current = 0;
    if (autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const handleItemDragStart = useCallback((itemId: string) => {
    setDraggingItemId(itemId);
  }, []);

  const handleItemDragEnd = useCallback(() => {
    stopAutoScroll();
    setDraggingItemId(null);
  }, [stopAutoScroll]);

  const handleReorder = useCallback((newOrder: AuditItem[]) => {
    if (!activeCategory) return;
    const updatedCategories = audit.categories.map(cat =>
      cat.id === activeCategory.id ? { ...cat, items: newOrder } : cat
    );
    onUpdates({ ...audit, categories: updatedCategories });
  }, [activeCategory, audit, onUpdates]);

  const handleDeleteItem = (itemId: string) => {
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus dokumen pemeriksaan ini dari berkas KKA?');
    if (!confirmed) return;
    const item = audit.categories.flatMap(c => c.items).find(i => i.id === itemId);
    const updatedCategories = audit.categories.map(cat => ({ ...cat, items: cat.items.filter(item => item.id !== itemId) }));
    onUpdates({ ...audit, categories: updatedCategories });
    logActivity('delete_item', 'audit_item', audit.opdName, { itemName: item?.title, category: audit.categories.find(c => c.items.some(i => i.id === itemId))?.name });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterCatId) return;
    const masterCat = availableMasterCategories.find(c => c.id === selectedMasterCatId);
    if (!masterCat) return;
    const newCategory: AuditCategory = {
      id: `cat_custom_${Date.now()}`, name: masterCat.name, description: masterCat.description,
      auditorName: newCatAuditorName, teamMembers: newCatTeamMembers, fiscalYear: audit.fiscalYear, status: 'Draft',
      items: masterCat.items.map(item => ({ ...item, id: `item_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, status: 'N/A', nilaiTemuan: 0, uraianTemuan: '', rekomendasi: '' }))
    };
    onUpdates({ ...audit, categories: [...audit.categories, newCategory] });
    logActivity('add_category', 'audit', audit.opdName, { categoryName: masterCat.name });
    setIsAddingCategory(false); setSelectedMasterCatId(''); setNewCatTeamMembers([]);
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
    const updatedCategories = audit.categories.map(cat => cat.id === activeCategory.id ? { ...cat, auditorName: editCatAuditorName, teamMembers: editCatTeamMembers, fiscalYear: editCatFiscalYear, status: editCatStatus } : cat);
    onUpdates({ ...audit, categories: updatedCategories });
    setIsEditingCategoryTeam(false);
  };

  const handleDeleteCategory = (catId: string) => {
    if (audit.categories.length <= 1) { onShowToast?.('Pemeriksaan KKA harus menyisakan minimal satu Jenis Audit.', 'error'); return; }
    const name = audit.categories.find(c => c.id === catId)?.name || '';
    if (!window.confirm(`Hapus Jenis Audit "${name}" beserta seluruh dokumennya?`)) return;
    const updatedCategories = audit.categories.filter(c => c.id !== catId);
    onUpdates({ ...audit, categories: updatedCategories });
    if (selectedCategoryId === catId) setSelectedCategoryId(updatedCategories[0].id);
  };

  const handleSaveMetadata = () => {
    onUpdates({ ...audit, opdName: metaSchoolName, opdType: metaOpdType, fiscalYear: metaFiscalYear });
    setIsEditingMetadata(false);
  };

  const handleSaveCoverToDokumen1 = async (file: File) => {
    const targetCategory = activeCategory || audit.categories[0];
    if (!targetCategory) { onShowToast?.("Tidak ada jenis audit aktif.", "error"); return; }
    try {
      const res = await uploadEvidenceFile(file, audit.fiscalYear, audit.opdName, audit.auditType);
      const historyEntry = { name: file.name, link: res.webViewLink, uploadedAt: new Date().toISOString(), uploadedBy: currentUserName || audit.auditorName || 'Auditor', action: 'diunggah' as const };
      const newItem: AuditItem = { id: `item_sampul_${Date.now()}`, title: 'Sampul KKP', description: `Dokumen Sampul KKP untuk ${targetCategory.name}`, status: 'N/A', nilaiTemuan: 0, uraianTemuan: '', rekomendasi: '', evidenceLink: res.webViewLink, evidenceName: file.name, evidenceHistory: [historyEntry] };
      const updatedCategories = audit.categories.map(cat => cat.id !== targetCategory.id ? cat : { ...cat, items: [newItem, ...cat.items] });
      onUpdates({ ...audit, categories: updatedCategories });
      onShowToast?.('Sampul berhasil disimpan!', 'success');
    } catch (err: any) {
      onShowToast?.(`Gagal: ${err.message}`, 'error');
    }
  };

  return (
    <>
    <div className="space-y-4 text-dark-gray" id="audit-workspace-view">

      {!isTeamMember && FUNGSIONAL_ROLES.includes(userRole) && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-3">
          <ShieldOff className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-rose-800 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Akses Terbatas — Hanya Baca</p>
            <p className="text-xs text-rose-700/80 mt-1 font-medium">Akun Anda tidak terdaftar sebagai tim pada jenis audit manapun.</p>
          </div>
        </div>
      )}

      {/* Single Card: Profile + Categories + Team + Buttons + Schedule + Items */}
      <div className="bg-white rounded-xl border border-dark-gray/10 shadow-xs divide-y divide-dark-gray/10">

        {/* Profile Auditi + Jenis Audit + Team + Actions */}
        <div className="p-4 space-y-3 bg-gradient-to-r from-pink-50 via-sky-50 to-violet-50 rounded-t-xl">

          {/* Profile Header */}
          {isEditingMetadata ? (
            <div className="space-y-2 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Nama OPD / Auditi</label>
                <input type="text" value={metaSchoolName} onChange={e => setMetaSchoolName(e.target.value)} className="w-full border border-dark-gray/15 p-1.5 rounded bg-white/70 text-dark-gray font-bold outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Tipe</label>
                  <select value={metaOpdType} onChange={e => setMetaOpdType(e.target.value as OpdAudit['opdType'])} className="w-full border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray font-bold outline-none">
                    {['SD','SMP','Dinas','Badan','Kecamatan','Desa','Kelurahan','Puskesmas','Sekretariat Daerah','Lainnya'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Tahun</label>
                  <select value={metaFiscalYear} onChange={e => setMetaFiscalYear(e.target.value)} className="w-full border border-dark-gray/15 p-1.5 rounded bg-white text-dark-gray font-bold outline-none">
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setIsEditingMetadata(false)} className="flex-1 text-[11px] bg-white py-1.5 rounded font-bold border border-dark-gray/15 cursor-pointer">Batal</button>
                <button onClick={handleSaveMetadata} className="flex-1 text-[11px] bg-peach-accent py-1.5 rounded font-black cursor-pointer">Simpan</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-dark-gray">{audit.opdName}</h1>
                <p className="text-sm text-dark-gray/60">Jenjang {audit.opdType} • TA {audit.fiscalYear}</p>
              </div>
              {STRUKTURAL_ROLES.includes(userRole) && (
                <button onClick={() => setIsEditingMetadata(true)} className="p-1 text-dark-gray/40 hover:text-dark-gray/70 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
              )}
            </div>
          )}

          {/* Jenis Audit — Invisible dropdown (only shows name + chevron) */}
          <div className="relative" ref={catDropdownRef}>
            <button
              onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
              className="flex items-center gap-1 text-base font-bold text-dark-gray cursor-pointer"
            >
              <span>{activeCategory?.name || 'Pilih Jenis Audit'}</span>
              <ChevronDown className="w-4 h-4 text-dark-gray/50" />
            </button>

            {isCatDropdownOpen && (
              <div className="absolute z-50 left-0 top-full mt-1 w-64 bg-white border border-dark-gray/15 rounded-xl shadow-lg overflow-hidden">
                {audit.categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between px-3 py-2.5 text-xs hover:bg-baby-blue cursor-pointer border-b border-dark-gray/5 last:border-b-0"
                    onClick={() => { setSelectedCategoryId(cat.id); setIsCatDropdownOpen(false); }}>
                    <span className={`font-bold ${cat.id === selectedCategoryId ? 'text-dark-gray' : 'text-dark-gray/70'}`}>{cat.name}</span>
                    <div className="flex items-center gap-1">
                      {cat.id === selectedCategoryId && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      {STRUKTURAL_ROLES.includes(userRole) && audit.categories.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); setIsCatDropdownOpen(false); }}
                          className="p-1 text-dark-gray/30 hover:text-rose-600 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                      )}
                    </div>
                  </div>
                ))}
                {STRUKTURAL_ROLES.includes(userRole) && (
                  <div onClick={() => { setIsCatDropdownOpen(false); setIsAddingCategory(true); }}
                    className="px-3 py-2.5 text-xs font-bold text-blue-600 hover:bg-baby-blue cursor-pointer border-t border-dark-gray/10">
                    + Tambah Jenis Audit
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Team Info */}
          <div className="flex items-start justify-between">
            <div className="text-xs text-dark-gray/60 font-medium space-y-0.5">
              <p>Ketua Tim: <span className="font-bold text-dark-gray">{activeCategory?.auditorName || 'Belum diatur'}</span></p>
              <p>Anggota: <span className="font-bold text-dark-gray">{activeCategory?.teamMembers?.length ? activeCategory.teamMembers.join(', ') : 'Belum diatur'}</span></p>
            </div>
            {(STRUKTURAL_ROLES.includes(userRole) || currentUserName === activeCategory?.auditorName) && (
              <button onClick={openEditCategoryTeam} className="p-1 text-dark-gray/40 hover:text-dark-gray/70 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
            )}
          </div>

          {/* Review Workflow */}
          {activeCategory && (
            <div className="flex items-center gap-2">
              {currentUserName === activeCategory.auditorName && (!activeCategory.status || activeCategory.status === 'Draft' || activeCategory.status === 'Sedang Berjalan') && (
                <button onClick={() => {
                  if (!window.confirm('Ajukan untuk direview pimpinan?')) return;
                  const newCategories = audit.categories.map(c => c.id === activeCategory.id ? { ...c, status: 'Direview' as any } : c);
                  const recalcStatus = newCategories.every(c => c.status === 'Selesai') ? 'Selesai' : newCategories.some(c => c.status === 'Direview') ? 'Direview' : 'Sedang Berjalan';
                  onUpdates({ ...audit, status: recalcStatus, categories: newCategories });
                  logActivity('submit_review', 'audit_category', audit.opdName, { category: activeCategory.name });
                  onShowToast?.('Diajukan ke Irban untuk review.', 'success');
                }} className="text-[10px] px-3 py-1.5 rounded-lg font-extrabold bg-blue-500 text-white hover:bg-blue-600 transition cursor-pointer">Ajukan Review</button>
              )}
              {STRUKTURAL_ROLES.includes(userRole) && activeCategory.status === 'Direview' && (
                <>
                  <button onClick={() => {
                    if (!window.confirm('Setujui dan Selesaikan?')) return;
                    const newCategories = audit.categories.map(c => c.id === activeCategory.id ? { ...c, status: 'Selesai' as any } : c);
                    const recalcStatus = newCategories.every(c => c.status === 'Selesai') ? 'Selesai' : newCategories.some(c => c.status === 'Direview') ? 'Direview' : 'Sedang Berjalan';
                    onUpdates({ ...audit, status: recalcStatus, categories: newCategories });
                    logActivity('approve_category', 'audit_category', audit.opdName, { category: activeCategory.name });
                    onShowToast?.('Disetujui.', 'success');
                  }} className="text-[10px] px-3 py-1.5 rounded-lg font-extrabold bg-emerald-500 text-white hover:bg-emerald-600 transition cursor-pointer">Setujui</button>
                  <button onClick={() => {
                    if (!window.confirm('Kembalikan ke Auditor untuk revisi?')) return;
                    const newCategories = audit.categories.map(c => c.id === activeCategory.id ? { ...c, status: 'Sedang Berjalan' as any } : c);
                    const recalcStatus = newCategories.every(c => c.status === 'Selesai') ? 'Selesai' : newCategories.some(c => c.status === 'Direview') ? 'Direview' : 'Sedang Berjalan';
                    onUpdates({ ...audit, status: recalcStatus, categories: newCategories });
                    logActivity('return_category', 'audit_category', audit.opdName, { category: activeCategory.name });
                    onShowToast?.('Dikembalikan.', 'info');
                  }} className="text-[10px] px-3 py-1.5 rounded-lg font-extrabold bg-rose-500 text-white hover:bg-rose-600 transition cursor-pointer">Kembalikan Revisi</button>
                </>
              )}
            </div>
          )}

          {/* Document Generator Buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {[
              { label: 'Sampul', color: 'text-peach-accent', onClick: () => setIsCoverModalOpen(true) },
              { label: 'Nota Dinas', color: 'text-emerald-600', onClick: () => setIsNotaDinasModalOpen(true) },
              { label: 'Surat Tugas', color: 'text-blue-600', onClick: () => setIsSuratTugasModalOpen(true) },
              { label: 'SPPD', color: 'text-purple-600', onClick: () => setIsSPPDModalOpen(true) },
            ].map(btn => (
              <button key={btn.label} onClick={btn.onClick}
                className="inline-flex items-center gap-1.5 text-[10px] bg-white border border-dark-gray/15 hover:bg-slate-50 text-dark-gray font-extrabold px-2.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer">
                <FileText className={`w-3.5 h-3.5 ${btn.color}`} /> {btn.label}
              </button>
            ))}
          </div>

        </div>

        {/* Schedule */}
        <div className="p-4 space-y-3 bg-amber-50/30">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-dark-gray/60" />
            <h3 className="text-xs font-bold text-dark-gray/80 uppercase tracking-wide">Jadwal Pelaksanaan</h3>
          </div>
          {milestones.map((m, index) => (
            <div key={m.id} className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 space-y-2.5">
              <span className="text-sm font-bold text-amber-800">{m.name}</span>
              <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-amber-700/60 uppercase">Tanggal Mulai</label>
                    <input type="date"
                      value={m.startDate || ''}
                      onChange={(e) => { const updated = [...milestones]; updated[index] = { ...m, startDate: e.target.value || '' }; handleUpdateSchedule(updated); }}
                      className="w-full text-[10px] font-bold border border-amber-200/60 p-1.5 rounded-lg bg-white focus:ring-1 focus:ring-amber-400 outline-none text-dark-gray"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-amber-700/60 uppercase">Tanggal Selesai</label>
                    <input type="date"
                      value={m.targetDate || ''}
                      onChange={(e) => { const updated = [...milestones]; updated[index] = { ...m, targetDate: e.target.value || '' }; handleUpdateSchedule(updated); }}
                      className="w-full text-[10px] font-bold border border-amber-200/60 p-1.5 rounded-lg bg-white focus:ring-1 focus:ring-amber-400 outline-none text-dark-gray"
                    />
                  </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dokumen KKA */}
        <div
          ref={itemsListRef}
          className="p-4 space-y-4 bg-baby-blue rounded-b-xl relative">

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-wide text-dark-gray">Dokumen KKA</h2>
            <span className="text-[10px] font-bold text-dark-gray/50">{activeCategory?.items.length || 0} item</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-dark-gray/75 uppercase tracking-wide">Spesifikasi Bukti</span>
            {FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && (
              <button onClick={() => { setIsAddingItem(true); setSearchQuery(''); }}
                className="text-[10px] font-extrabold text-white bg-dark-gray hover:bg-dark-gray/80 px-2.5 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1">
                <Plus className="w-3 h-3" /> Tambah Item
              </button>
            )}
          </div>

          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-gray/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Cari spesifikasi..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-dark-gray/20 rounded-lg text-xs bg-white/50 focus:ring-1 focus:ring-slate-800 outline-none text-dark-gray" />
          </div>

          {isAddingItem && (
            <form onSubmit={handleAddItem} className="bg-white border-2 border-dashed border-dark-gray/30 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide">Nama Dokumen</label>
                <input type="text" required placeholder="Misal: Bukti SSP PPh Pasal 21" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none focus:ring-2 focus:ring-dark-gray/20" autoFocus />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/65 uppercase tracking-wide">Deskripsi (opsional)</label>
                <input type="text" placeholder="Keterangan tambahan..." value={newItemDescription} onChange={e => setNewItemDescription(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none focus:ring-2 focus:ring-dark-gray/20" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button type="submit" className="text-[10px] font-extrabold bg-dark-gray text-white px-3 py-1.5 rounded-lg hover:bg-dark-gray/80 transition cursor-pointer">Simpan</button>
                <button type="button" onClick={() => { setIsAddingItem(false); setNewItemTitle(''); setNewItemDescription(''); }}
                  className="text-[10px] font-bold text-dark-gray/70 hover:text-dark-gray px-3 py-1.5 rounded-lg border border-dark-gray/20 hover:bg-dark-gray/5 transition cursor-pointer">Batal</button>
              </div>
            </form>
          )}



          {!searchQuery.trim() ? (
            <Reorder.Group
              axis="y"
              values={filteredItems}
              onReorder={handleReorder}
              className="space-y-3"
            >
              <AnimatePresence initial={false}>
                {filteredItems.map((item, idx) => (
                  <AuditItemCard
                    key={item.id}
                    item={item}
                    idx={idx}
                    canDrag={FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly}
                    isDragging={draggingItemId === item.id}
                    onDragStart={handleItemDragStart}
                    onDrag={handleItemDrag}
                    onDragEnd={handleItemDragEnd}
                    editingTitleId={editingTitleId}
                    editItemTitle={editItemTitle}
                    setEditingTitleId={setEditingTitleId}
                    setEditItemTitle={setEditItemTitle}
                    isReadOnly={isReadOnly}
                    userRole={userRole}
                    FUNGSIONAL_ROLES={FUNGSIONAL_ROLES}
                    handleFindingDetailChange={handleFindingDetailChange}
                    handleFindingDetailsUpdate={handleFindingDetailsUpdate}
                    uploadingIds={uploadingIds}
                    copyingIds={copyingIds}
                    handleDirectUpload={handleDirectUpload}
                    handleFolderUpload={handleFolderUpload}
                    handleDeleteEvidenceFile={handleDeleteEvidenceFile}
                    handleDirectCopy={handleDirectCopy}
                    checkConflict={checkConflict}
                    handleDeleteItem={handleDeleteItem}
                    currentUserName={currentUserName}
                    audit={audit}
                    onShowToast={onShowToast}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, idx) => (
                <AuditItemCardStatic
                  key={item.id}
                  item={item}
                  idx={idx}
                  editingTitleId={editingTitleId}
                  editItemTitle={editItemTitle}
                  setEditingTitleId={setEditingTitleId}
                  setEditItemTitle={setEditItemTitle}
                  isReadOnly={isReadOnly}
                  userRole={userRole}
                  FUNGSIONAL_ROLES={FUNGSIONAL_ROLES}
                  handleFindingDetailChange={handleFindingDetailChange}
                  handleFindingDetailsUpdate={handleFindingDetailsUpdate}
                  uploadingIds={uploadingIds}
                  copyingIds={copyingIds}
                  handleDirectUpload={handleDirectUpload}
                  handleFolderUpload={handleFolderUpload}
                  handleDeleteEvidenceFile={handleDeleteEvidenceFile}
                  handleDirectCopy={handleDirectCopy}
                  checkConflict={checkConflict}
                  handleDeleteItem={handleDeleteItem}
                  currentUserName={currentUserName}
                  audit={audit}
                  onShowToast={onShowToast}
                />
              ))}
            </div>
          )}



          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-xs text-dark-gray/50 italic font-medium">
              {searchQuery.trim() ? 'Tidak ada spesifikasi yang cocok.' : 'Belum ada item. Klik "Tambah Item" untuk memulai.'}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-dark-gray/10 text-dark-gray">
            <div className="bg-dark-gray text-white px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <span className="font-extrabold text-xs tracking-wide">Tambah Jenis Audit</span>
              <button onClick={() => setIsAddingCategory(false)} className="text-white/80 hover:text-white cursor-pointer text-xs font-bold">Tutup</button>
            </div>
            <form onSubmit={handleAddCategory} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Pilih Jenis Audit</label>
                {availableMasterCategories.length > 0 ? (
                  <select value={selectedMasterCatId} onChange={e => setSelectedMasterCatId(e.target.value)} className="w-full border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray font-bold outline-none" required>
                    <option value="" disabled>-- Pilih --</option>
                    {availableMasterCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                ) : (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100 font-semibold">Semua sudah ditambahkan.</div>
                )}
              </div>
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Ketua Tim</label>
                <div onClick={() => setIsNewCatAuditorDropdownOpen(!isNewCatAuditorDropdownOpen)} className="w-full border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray font-bold cursor-pointer flex justify-between items-center">
                  <span>{newCatAuditorName || '-- Pilih --'}</span>
                  <ChevronDown className="w-4 h-4 text-dark-gray/50" />
                </div>
                {isNewCatAuditorDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-hidden flex flex-col">
                    <div className="p-2 border-b bg-slate-50 sticky top-0"><input type="text" placeholder="Cari..." value={newCatAuditorSearchQuery} onChange={e => setNewCatAuditorSearchQuery(e.target.value)} onClick={e => e.stopPropagation()} className="w-full text-[10px] border px-2 py-1.5 rounded bg-white outline-none" /></div>
                    <div className="overflow-y-auto p-1">
                      {userProfiles
                        .filter(p => KETUA_TIM_ROLES.includes(p.role))
                        .filter(p => (p.full_name || p.email).toLowerCase().includes(newCatAuditorSearchQuery.toLowerCase()))
                        .sort(byNipAge)
                        .map(p => (
                        <div key={p.id} onClick={() => { setNewCatAuditorName(p.full_name || p.email); setIsNewCatAuditorDropdownOpen(false); setNewCatAuditorSearchQuery(''); }} className={`text-[10px] p-2 rounded cursor-pointer flex items-center justify-between ${newCatAuditorName === (p.full_name || p.email) ? 'bg-peach-accent/20 font-bold' : 'hover:bg-dark-gray/5'}`}>
                          <div>
                            <span className="block">{p.full_name || p.email}</span>
                            {p.role && <span className="text-[9px] text-dark-gray/40 font-normal">{p.role}</span>}
                          </div>
                          {newCatAuditorName === (p.full_name || p.email) && <Check className="w-3 h-3" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Anggota Tim</label>
                <div onClick={() => setIsNewCatTeamDropdownOpen(!isNewCatTeamDropdownOpen)} className="w-full border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray font-bold cursor-pointer flex justify-between items-center">
                  <span>{newCatTeamMembers.length > 0 ? `${newCatTeamMembers.length} dipilih` : '-- Pilih --'}</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
                {isNewCatTeamDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-hidden flex flex-col">
                    <div className="p-2 border-b bg-slate-50 sticky top-0"><input type="text" placeholder="Cari..." value={newCatTeamSearchQuery} onChange={e => setNewCatTeamSearchQuery(e.target.value)} onClick={e => e.stopPropagation()} className="w-full text-[10px] border px-2 py-1.5 rounded bg-white outline-none" /></div>
                    <div className="overflow-y-auto p-1">
                      {userProfiles
                        .filter(p => ANGGOTA_TIM_ROLES.includes(p.role))
                        .filter(p => (p.full_name || p.email).toLowerCase().includes(newCatTeamSearchQuery.toLowerCase()))
                        .sort(byNipAge)
                        .map(p => {
                        const name = p.full_name || p.email;
                        return <div key={p.id} onClick={e => { e.stopPropagation(); if (newCatTeamMembers.includes(name)) setNewCatTeamMembers(prev => prev.filter(n => n !== name)); else setNewCatTeamMembers(prev => [...prev, name]); }} className={`text-[10px] p-2 rounded cursor-pointer flex items-center justify-between ${newCatTeamMembers.includes(name) ? 'bg-peach-accent/20 font-bold' : 'hover:bg-dark-gray/5'}`}>
                          <div>
                            <span className="block">{name}</span>
                            {p.role && <span className="text-[9px] text-dark-gray/40 font-normal">{p.role}</span>}
                          </div>
                          {newCatTeamMembers.includes(name) && <Check className="w-3 h-3" />}
                        </div>;
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsAddingCategory(false)} className="flex-1 bg-white py-2 border border-dark-gray/15 rounded-lg font-bold cursor-pointer">Batal</button>
                <button type="submit" disabled={!selectedMasterCatId} className="flex-1 bg-peach-accent py-2 rounded-lg font-black cursor-pointer disabled:opacity-50">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditingCategoryTeam && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-dark-gray/10 text-dark-gray">
            <div className="bg-dark-gray text-white px-4 py-3 flex items-center justify-between rounded-t-2xl">
              <span className="font-extrabold text-xs tracking-wide">Edit Tim & Status</span>
              <button onClick={() => setIsEditingCategoryTeam(false)} className="text-white/80 hover:text-white cursor-pointer text-xs font-bold">Tutup</button>
            </div>
            <form onSubmit={handleSaveCategoryTeam} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Ketua Tim</label>
                <div onClick={() => setIsEditCatAuditorDropdownOpen(!isEditCatAuditorDropdownOpen)} className="w-full border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray font-bold cursor-pointer flex justify-between items-center">
                  <span>{editCatAuditorName || '-- Pilih --'}</span>
                  <ChevronDown className="w-4 h-4" /></div>
                {isEditCatAuditorDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-hidden flex flex-col">
                    <div className="p-2 border-b bg-slate-50 sticky top-0"><input type="text" placeholder="Cari..." value={editCatAuditorSearchQuery} onChange={e => setEditCatAuditorSearchQuery(e.target.value)} onClick={e => e.stopPropagation()} className="w-full text-[10px] border px-2 py-1.5 rounded bg-white outline-none" /></div>
                    <div className="overflow-y-auto p-1">{userProfiles
                        .filter(p => KETUA_TIM_ROLES.includes(p.role))
                        .filter(p => (p.full_name || p.email).toLowerCase().includes(editCatAuditorSearchQuery.toLowerCase()))
                        .sort(byNipAge)
                        .map(p => (
                      <div key={p.id} onClick={() => { setEditCatAuditorName(p.full_name || p.email); setIsEditCatAuditorDropdownOpen(false); setEditCatAuditorSearchQuery(''); }} className={`text-[10px] p-2 rounded cursor-pointer flex items-center justify-between ${editCatAuditorName === (p.full_name || p.email) ? 'bg-peach-accent/20 font-bold' : 'hover:bg-dark-gray/5'}`}>
                        <div>
                          <span className="block">{p.full_name || p.email}</span>
                          {p.role && <span className="text-[9px] text-dark-gray/40 font-normal">{p.role}</span>}
                        </div>
                        {editCatAuditorName === (p.full_name || p.email) && <Check className="w-3 h-3" />}
                      </div>
                    ))}</div>
                  </div>
                )}
              </div>
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Anggota Tim</label>
                <div onClick={() => setIsEditCatTeamDropdownOpen(!isEditCatTeamDropdownOpen)} className="w-full border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray font-bold cursor-pointer flex justify-between items-center">
                  <span>{editCatTeamMembers.length > 0 ? `${editCatTeamMembers.length} dipilih` : '-- Pilih --'}</span>
                  <ChevronDown className="w-4 h-4" /></div>
                {isEditCatTeamDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-hidden flex flex-col">
                    <div className="p-2 border-b bg-slate-50 sticky top-0"><input type="text" placeholder="Cari..." value={editCatTeamSearchQuery} onChange={e => setEditCatTeamSearchQuery(e.target.value)} onClick={e => e.stopPropagation()} className="w-full text-[10px] border px-2 py-1.5 rounded bg-white outline-none" /></div>
                    <div className="overflow-y-auto p-1">{userProfiles
                        .filter(p => ANGGOTA_TIM_ROLES.includes(p.role))
                        .filter(p => (p.full_name || p.email).toLowerCase().includes(editCatTeamSearchQuery.toLowerCase()))
                        .sort(byNipAge)
                        .map(p => {
                      const name = p.full_name || p.email;
                      return <div key={p.id} onClick={e => { e.stopPropagation(); if (editCatTeamMembers.includes(name)) setEditCatTeamMembers(prev => prev.filter(n => n !== name)); else setEditCatTeamMembers(prev => [...prev, name]); }} className={`text-[10px] p-2 rounded cursor-pointer flex items-center justify-between ${editCatTeamMembers.includes(name) ? 'bg-peach-accent/20 font-bold' : 'hover:bg-dark-gray/5'}`}>
                        <div>
                          <span className="block">{name}</span>
                          {p.role && <span className="text-[9px] text-dark-gray/40 font-normal">{p.role}</span>}
                        </div>
                        {editCatTeamMembers.includes(name) && <Check className="w-3 h-3" />}
                      </div>;
                    })}</div>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Status</label>
                <select value={editCatStatus} onChange={e => setEditCatStatus(e.target.value as AuditStatus)} className="w-full border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray font-bold outline-none">
                  <option value="Draft">Draft</option>
                  <option value="Sedang Berjalan">Sedang Berjalan</option>
                  <option value="Direview">Direview</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsEditingCategoryTeam(false)} className="flex-1 bg-white py-2 border border-dark-gray/15 rounded-lg font-bold cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 bg-peach-accent py-2 rounded-lg font-black cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCoverModalOpen && <CoverDocumentGenerator audit={audit} activeCategory={activeCategory} userProfiles={userProfiles} onClose={() => setIsCoverModalOpen(false)} onSaveAsDokumen1={handleSaveCoverToDokumen1} />}
      {isSuratTugasModalOpen && <SuratTugasGenerator audit={audit} activeCategory={activeCategory} userProfiles={userProfiles} onClose={() => setIsSuratTugasModalOpen(false)} />}
      {isNotaDinasModalOpen && <NotaDinasGenerator audit={audit} activeCategory={activeCategory} userProfiles={userProfiles} onClose={() => setIsNotaDinasModalOpen(false)} />}
      {isSPPDModalOpen && <SPPDGenerator audit={audit} activeCategory={activeCategory} userProfiles={userProfiles} onClose={() => setIsSPPDModalOpen(false)} />}
    </div>

      {/* Fixed viewport-level auto-scroll hint zones */}
      <AnimatePresence>
        {draggingItemId !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-0 left-0 right-0 z-[100] pointer-events-none h-16 flex items-center justify-center border-b border-blue-300 bg-gradient-to-b from-blue-50 to-blue-50/0"
          >
            <span className="text-[11px] font-bold text-blue-500 flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full shadow-xs border border-blue-200">
              <svg className="w-3 h-3 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
              Gulir ke atas
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {draggingItemId !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none h-16 flex items-center justify-center border-t border-blue-300 bg-gradient-to-t from-blue-50 to-blue-50/0"
          >
            <span className="text-[11px] font-bold text-blue-500 flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full shadow-xs border border-blue-200">
              <svg className="w-3 h-3 animate-bounce" style={{ animationDirection: 'alternate-reverse' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              Gulir ke bawah
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared props + body for a single "Dokumen KKA" item card
// ---------------------------------------------------------------------------
interface AuditItemCardBodyProps {
  item: AuditItem;
  idx: number;
  editingTitleId: string | null;
  editItemTitle: string;
  setEditingTitleId: (id: string | null) => void;
  setEditItemTitle: (title: string) => void;
  isReadOnly: boolean;
  userRole: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur';
  FUNGSIONAL_ROLES: string[];
  handleFindingDetailChange: (itemId: string, field: keyof AuditItem, value: any) => void;
  handleFindingDetailsUpdate: (itemId: string, updates: Partial<AuditItem>) => void;
  uploadingIds: Record<string, boolean>;
  copyingIds: Record<string, boolean>;
  handleDirectUpload: (itemId: string, file: File, newName?: string) => Promise<void>;
  handleFolderUpload: (itemId: string, files: File[], onProgress?: (done: number, total: number) => void) => Promise<void>;
  handleDeleteEvidenceFile: (itemId: string, fileId: string) => Promise<void>;
  handleDirectCopy: (itemId: string, sourceUrl: string, currentName: string) => Promise<void>;
  checkConflict: (itemId: string, actionName?: string) => Promise<boolean>;
  handleDeleteItem: (itemId: string) => void;
  currentUserName: string;
  audit: OpdAudit;
  onShowToast?: (message: string, type: 'error' | 'info' | 'success') => void;
  dragHandleProps?: { onPointerDown: (e: React.PointerEvent) => void };
  showGripHandle?: boolean;
}

function AuditItemCardBody({
  item, idx, editingTitleId, editItemTitle, setEditingTitleId, setEditItemTitle,
  isReadOnly, userRole, FUNGSIONAL_ROLES, handleFindingDetailChange, handleFindingDetailsUpdate,
  uploadingIds, copyingIds, handleDirectUpload, handleFolderUpload, handleDeleteEvidenceFile,
  handleDirectCopy, checkConflict, handleDeleteItem, currentUserName, audit, onShowToast,
  dragHandleProps, showGripHandle
}: AuditItemCardBodyProps) {
  return (
    <>
      <div className="bg-emerald-50/60 px-4 py-3 border-b border-emerald-100/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {showGripHandle && (
                <span
                  className="flex items-center justify-center w-9 h-9 -ml-2 -my-2 shrink-0 cursor-grab active:cursor-grabbing touch-none rounded-lg active:bg-black/5"
                  onPointerDown={dragHandleProps?.onPointerDown}
                  style={{ touchAction: 'none' }}
                >
                  <GripVertical className="w-4 h-4 text-dark-gray/40 pointer-events-none" />
                </span>
              )}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 bg-sky-100 text-sky-700">Dokumen {idx + 1}</span>
              {editingTitleId === item.id ? (
                <input type="text" value={editItemTitle}
                  onChange={e => setEditItemTitle(e.target.value)}
                  onBlur={() => { if (editItemTitle.trim()) handleFindingDetailChange(item.id, 'title', editItemTitle.trim()); setEditingTitleId(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') { if (editItemTitle.trim()) handleFindingDetailChange(item.id, 'title', editItemTitle.trim()); setEditingTitleId(null); } if (e.key === 'Escape') setEditingTitleId(null); }}
                  className="text-xs md:text-sm font-bold text-dark-gray border border-dark-gray/30 rounded px-1.5 py-0.5 w-full outline-none focus:ring-1 focus:ring-dark-gray/30" autoFocus />
              ) : (
                <h4 className="text-xs md:text-sm font-bold text-dark-gray">{item.title}</h4>
              )}
              {FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && editingTitleId !== item.id && (
                <button onClick={() => { setEditingTitleId(item.id); setEditItemTitle(item.title); }} className="p-0.5 text-dark-gray/30 hover:text-dark-gray/70 cursor-pointer shrink-0"><Edit2 className="w-3 h-3" /></button>
              )}
            </div>
            {item.description && <p className="text-xs text-dark-gray/70 mt-1">{item.description}</p>}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <EvidencePanel
          evidenceFiles={item.evidenceFiles}
          isReadOnly={isReadOnly} isAuditor={FUNGSIONAL_ROLES.includes(userRole)}
          isUploading={!!uploadingIds[item.id]} isCopying={!!copyingIds[item.id]}
          onUploadFile={async (file, newName) => handleDirectUpload(item.id, file, newName)}
          onUploadFolder={async (files, onProgress) => handleFolderUpload(item.id, files, onProgress)}
          onDeleteEvidenceFile={async (fileId) => handleDeleteEvidenceFile(item.id, fileId)}
          onCopyFromUrl={async (url, name) => handleDirectCopy(item.id, url, name)}
          onChangeLink={(link) => handleFindingDetailChange(item.id, 'evidenceLink', link)}
          onChangeName={(name) => {
            const files = item.evidenceFiles ? [...item.evidenceFiles] : [];
            if (files.length > 0) {
              files[0] = { ...files[0], name };
              handleFindingDetailsUpdate(item.id, { evidenceFiles: files, evidenceName: name });
            } else {
              handleFindingDetailChange(item.id, 'evidenceName', name);
            }
          }}
          onRenameFile={(fileId, newName) => {
            const files = item.evidenceFiles ? [...item.evidenceFiles] : [];
            const fi = files.findIndex(f => f.id === fileId);
            if (fi !== -1) { files[fi] = { ...files[fi], name: newName }; handleFindingDetailsUpdate(item.id, { evidenceFiles: files }); }
          }}
          onReorderFiles={(files) => handleFindingDetailsUpdate(item.id, { evidenceFiles: files })}
          onClear={async () => {
            const hasConflict = await checkConflict(item.id, 'Hapus item');
            if (hasConflict) return;
            const prevHistory = item.evidenceHistory || [];
            handleFindingDetailsUpdate(item.id, { evidenceFiles: [], evidenceLink: '', evidenceName: '', evidenceHistory: [...prevHistory, { name: item.evidenceName || 'Dokumen', link: item.evidenceLink || '', uploadedAt: new Date().toISOString(), uploadedBy: currentUserName || audit.auditorName || 'Auditor', action: 'dihapus' as const }] });
            onShowToast?.('Dokumen dihapus.', 'info');
          }}
          onShowToast={onShowToast}
        />

        {/* Riwayat Dokumen */}
        {item.evidenceHistory && item.evidenceHistory.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer list-none flex items-center gap-1.5 text-[10px] font-bold text-dark-gray/50 hover:text-dark-gray/70 select-none">
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              Riwayat Dokumen ({item.evidenceHistory.length})
            </summary>
            <div className="mt-2 space-y-1.5 border-l-2 border-slate-200 pl-3 ml-1">
              {[...item.evidenceHistory].reverse().map((h, hi) => (
                <div key={hi} className="text-[10px] text-dark-gray/60">
                  <span className={`inline-block px-1.5 py-0.5 rounded font-bold mr-1.5 ${
                    h.action === 'diunggah' ? 'bg-emerald-100 text-emerald-700' :
                    h.action === 'ditautkan' ? 'bg-blue-100 text-blue-700' :
                    h.action === 'dihapus' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{h.action || 'diubah'}</span>
                  {h.link ? (
                    <a href={h.link} target="_blank" rel="noreferrer" className="font-semibold text-dark-gray/80 hover:underline mr-1.5">{h.name}</a>
                  ) : (
                    <span className="font-semibold text-dark-gray/80 mr-1.5">{h.name}</span>
                  )}
                  <span className="text-dark-gray/40">oleh {h.uploadedBy} · {new Date(h.uploadedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        {FUNGSIONAL_ROLES.includes(userRole) && !isReadOnly && (
          <div className="flex justify-end pt-1">
            <button onClick={() => handleDeleteItem(item.id)}
              className="text-[10px] text-rose-700 hover:text-rose-950 font-bold inline-flex items-center gap-0.5 cursor-pointer bg-white border border-dark-gray/10 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors">
              <Trash2 className="w-3 h-3" /> Hapus item
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Draggable version — used when the list is sortable (no active search filter)
// ---------------------------------------------------------------------------
interface AuditItemCardProps extends Omit<AuditItemCardBodyProps, 'dragHandleProps' | 'showGripHandle'> {
  canDrag: boolean;
  isDragging: boolean;
  onDragStart: (itemId: string) => void;
  onDrag: (event: any, info: { point: { x: number; y: number } }) => void;
  onDragEnd: () => void;
}

function AuditItemCard(props: AuditItemCardProps) {
  const { item, canDrag, isDragging, onDragStart, onDrag, onDragEnd, ...bodyProps } = props;
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => onDragStart(item.id)}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging ? '0 12px 28px -8px rgba(30,41,59,0.35)' : '0 1px 2px rgba(0,0,0,0.04)'
      }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.6 }}
      whileDrag={{ cursor: 'grabbing' }}
      className={`rounded-xl border overflow-hidden bg-gray-50/80 relative ${
        isDragging ? 'border-blue-400 ring-2 ring-blue-200 z-10' : 'border-gray-200/60'
      }`}
      style={{ touchAction: canDrag ? 'pan-y' : undefined }}
    >
      <AuditItemCardBody
        {...bodyProps}
        item={item}
        showGripHandle={canDrag}
        dragHandleProps={{ onPointerDown: (e) => { if (canDrag) dragControls.start(e); } }}
      />
    </Reorder.Item>
  );
}

// ---------------------------------------------------------------------------
// Static (non-draggable) version — used while a search filter is active
// ---------------------------------------------------------------------------
function AuditItemCardStatic(props: AuditItemCardBodyProps) {
  return (
    <div className="rounded-xl border border-gray-200/60 shadow-xs overflow-hidden bg-gray-50/80">
      <AuditItemCardBody {...props} showGripHandle={false} />
    </div>
  );
}
