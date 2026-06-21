/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  School, 
  Settings, 
  Cloud,
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  TrendingDown, 
  FolderSync,
  ChevronDown,
  Menu,
  X,
  User as UserIcon,
  ShieldAlert,
  Info,
  PlusCircle,
  PieChart,
  Building
} from 'lucide-react';

import { OpdAudit, KKATemplate, SyncLog, AuditCategory, AuditItem, UserProfile, TargetEntity, Permission, Bidang, Role, RolePermission } from './types';
import { EMPTY_KKA_TEMPLATE } from './data';
import { supabase } from './lib/supabase';
import { permissionChecker } from './lib/permissions';
import { Session, User } from '@supabase/supabase-js';

// Custom subcomponents
import HomeView from './components/HomeView';
import AuditListView from './components/AuditListView';
import AuditWorkspaceView from './components/AuditWorkspaceView';
import TemplateConfiguratorView from './components/TemplateConfiguratorView';
import LoginView from './components/LoginView';
import NewAuditView from './components/NewAuditView';
import StatistikView from './components/StatistikView';
import UserProfileView from './components/UserProfileView';
import UserManagementView from './components/UserManagementView';
import RolePermissionView from './components/RolePermissionView';
import WilayahPenugasanView from './components/WilayahPenugasanView';
import ReviuView from './components/ReviuView';
import EvaluasiView from './components/EvaluasiView';
import AsistensiView from './components/AsistensiView';

export default function App() {
  // Navigation & General Tabs based on URL Hash
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pengawasan' | 'jenis-audit' | 'new-audit' | 'statistik' | 'profil' | 'pengguna' | 'role-permission' | 'wilayah-penugasan'>('dashboard');
  const [pengawasanSubTab, setPengawasanSubTab] = useState<'audit' | 'reviu' | 'evaluasi' | 'asistensi'>('audit');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [userBidangId, setUserBidangId] = useState<number | null>(null);
  const [bidangList, setBidangList] = useState<Bidang[]>([]);
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);

  // Router logic for hash changes (browser back/forward support)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('workspace/')) {
        const parts = hash.split('/');
        const id = parts[1];
        const catId = parts[2] || null;
        setSelectedAuditId(id);
        setSelectedCategoryId(catId);
        setActiveTab('pengawasan');
        setPengawasanSubTab('audit');
      } else if (hash === 'pengawasan') {
        setActiveTab('pengawasan');
        setPengawasanSubTab('audit');
        setSelectedAuditId(null);
        setSelectedCategoryId(null);
      } else if (hash.startsWith('pengawasan/')) {
        const sub = hash.split('/')[1] as 'audit' | 'reviu' | 'evaluasi' | 'asistensi';
        setActiveTab('pengawasan');
        setPengawasanSubTab(sub || 'audit');
        setSelectedAuditId(null);
        setSelectedCategoryId(null);
      } else if (['jenis-audit', 'dashboard', 'new-audit', 'statistik', 'profil', 'pengguna', 'role-permission', 'wilayah-penugasan'].includes(hash)) {
        setActiveTab(hash as any);
        setSelectedAuditId(null);
        setSelectedCategoryId(null);
      } else {
        setActiveTab('dashboard');
        setSelectedAuditId(null);
        setSelectedCategoryId(null);
      }
    };

    // Initialize on load
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#dashboard');
    }
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path: string) => {
    window.location.hash = path;
  };

  const navigateToPengawasan = (sub: 'audit' | 'reviu' | 'evaluasi' | 'asistensi') => {
    setActiveTab('pengawasan');
    setPengawasanSubTab(sub);
    setSelectedAuditId(null);
    setSelectedCategoryId(null);
    window.location.hash = `pengawasan/${sub}`;
  };

  // Core Applet States
  const [audits, setAudits] = useState<OpdAudit[]>([]);
  const [templates, setTemplates] = useState<KKATemplate[]>([EMPTY_KKA_TEMPLATE]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  // Simulated internal account role ('Auditor' | 'Inspektur Pembantu' | 'Inspektur')
  const [userRole, setUserRole] = useState<string>(
    localStorage.getItem('si_pesat_user_role') || 'Auditor Pelaksana'
  );
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('si_pesat_is_admin') === 'true');

  // Session Login gate state
  const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
    return localStorage.getItem('si_pesat_session_active') === 'true';
  });
  const [customAuditorName, setCustomAuditorName] = useState<string>(() => {
    return localStorage.getItem('si_pesat_custom_name') || '';
  });

  // Sync permissionChecker from localStorage at init (biar tidak ada jeda)
  React.useEffect(() => {
    if (localStorage.getItem('si_pesat_is_admin') === 'true') {
      permissionChecker.setUser(null, null, true);
    }
  }, []);

  // Authentication & Cloud Sync
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [targetEntities, setTargetEntities] = useState<TargetEntity[]>([]);

  // Dropdown hover state with timeout biar tidak cepat hilang
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const dropdownTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDropdownTimer = () => {
    if (dropdownTimer.current) { clearTimeout(dropdownTimer.current); dropdownTimer.current = null; }
  };

  const handleDropdownEnter = (name: string) => {
    clearDropdownTimer();
    setOpenDropdowns(prev => ({ ...prev, [name]: true }));
  };

  const handleDropdownLeave = (name: string) => {
    dropdownTimer.current = setTimeout(() => {
      setOpenDropdowns(prev => ({ ...prev, [name]: false }));
    }, 250);
  };

  // Form notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Trigger Toast Alert
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  }, []);

  // 1. Load data from localStorage on component mount
  useEffect(() => {
    const cachedAudits = localStorage.getItem('si_pesat_audits');
    const cachedTemplate = localStorage.getItem('si_pesat_template');
    const cachedLogs = localStorage.getItem('si_pesat_logs');

    if (cachedAudits) {
      try {
        let parsed = JSON.parse(cachedAudits);
        
        // Auto-migrate legacy string IDs to proper UUIDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        parsed = parsed.map((a: any) => {
          if (!uuidRegex.test(a.id)) {
            // Provide a real UUID fallback
            const fallbackUUID = typeof crypto !== 'undefined' && crypto.randomUUID 
              ? crypto.randomUUID() 
              : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
            return { ...a, id: fallbackUUID };
          }
          return a;
        });
        
        setAudits(parsed);
      } catch (e) {
        console.error('Error parsing cached school audits:', e);
        setAudits([]);
      }
    } else {
      setAudits([]);
    }

    if (cachedTemplate) {
      try {
        const parsed = JSON.parse(cachedTemplate);
        if (Array.isArray(parsed)) {
          setTemplates(parsed);
        } else {
          setTemplates([parsed]);
        }
      } catch (e) {
        console.error('Error parsing cached KKA templates:', e);
        setTemplates([EMPTY_KKA_TEMPLATE]);
      }
    } else {
      setTemplates([EMPTY_KKA_TEMPLATE]);
    }

    if (cachedLogs) {
      try {
        setSyncLogs(JSON.parse(cachedLogs));
      } catch (e) {
        setSyncLogs([]);
      }
    }

    // Try to fetch real data from Supabase to overwrite local cache if online
    const fetchAudits = () => {
      supabase.from('audits').select('*').then(({ data, error }) => {
        if (!error && data) {
          const mapped = data.map(d => ({
            id: d.id,
            opdName: d.opd_name,
            opdType: d.opd_type,
            auditType: d.audit_type || 'Audit Keuangan',
            fiscalYear: d.fiscal_year,
            auditorName: d.auditor_name,
            auditDate: d.audit_date,
            status: d.status,
            progress: d.progress,
            teamMembers: d.team_members || [],
            categories: d.categories || [],
            lastSyncedAt: d.updated_at || new Date().toISOString(),
            schedule: d.schedule || []
          }));
          
          setAudits(prevLocalAudits => {
            const offlineCreatedAudits = prevLocalAudits.filter(
              local => !mapped.find(m => m.id === local.id) && !local.lastSyncedAt
            );
            return [...mapped, ...offlineCreatedAudits];
          });
        }
      });
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'si_pesat_audits' && e.newValue) {
        try {
          setAudits(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    if (navigator.onLine) {
      fetchAudits();

      // Realtime subscription
      const auditsChannel = supabase.channel('audits_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'audits' }, () => {
          fetchAudits();
        })
        .subscribe();

      supabase.from('templates').select('*').then(({ data, error }) => {
        if (!error && data) {
          const fetchedTemplates = data.map(d => ({
            id: d.id,
            name: d.name,
            isDefault: d.is_default,
            categories: d.categories || [],
            lastSyncedAt: d.updated_at || new Date().toISOString()
          }));
          
          setTemplates(prevLocalTemplates => {
            // Keep local templates that are NOT in DB but have NO lastSyncedAt
            const offlineCreatedTemplates = prevLocalTemplates.filter(
              local => !fetchedTemplates.find(m => m.id === local.id) && !(local as any).lastSyncedAt && !local.isDefault
            );
            const merged = [...fetchedTemplates, ...offlineCreatedTemplates];
            return merged.length > 0 ? merged : [EMPTY_KKA_TEMPLATE];
          });
        }
      });
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 2. Persist state changes in localStorage
  useEffect(() => {
    if (audits.length > 0) {
      localStorage.setItem('si_pesat_audits', JSON.stringify(audits));
    }
  }, [audits, templates]);

  useEffect(() => {
    localStorage.setItem('si_pesat_template', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('si_pesat_logs', JSON.stringify(syncLogs));
  }, [syncLogs]);

  useEffect(() => {
    localStorage.setItem('si_pesat_user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('si_pesat_is_admin', JSON.stringify(isAdmin));
  }, [isAdmin]);


  // Supabase Background Sync (Debounced)
  useEffect(() => {
    const handleSync = async () => {
      if (!navigator.onLine) return;
      
      try {
        if (audits.length > 0) {
          // UUID validation regex to prevent Supabase rejection
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          const validAudits = audits.filter(a => uuidRegex.test(a.id));

          if (validAudits.length > 0) {
            const payload = validAudits.map(a => ({
              id: a.id,
              opd_name: a.opdName,
              opd_type: a.opdType,
              fiscal_year: a.fiscalYear,
              auditor_name: a.auditorName,
              audit_date: a.auditDate,
              status: a.status,
              progress: calculateProgress(a),
              categories: a.categories,
              team_members: a.teamMembers || [],
              schedule: a.schedule || [],
              updated_at: new Date().toISOString()
            }));

            const { error } = await supabase.from('audits').upsert(payload, { onConflict: 'id' });
            if (error) {
              console.error('Background sync audits failed:', error);
              setSyncLogs(prev => [{
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                action: 'ERROR',
                details: `Gagal menyimpan KKA ke Database: ${error.message || JSON.stringify(error)}`
              }, ...prev].slice(0, 50));
            } else {
              setSyncLogs(prev => [{
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                action: 'UPLOAD',
                details: `Sinkronisasi KKA latar belakang berhasil.`
              }, ...prev].slice(0, 50));
            }
          }
        }

        if (templates && templates.length > 0) {
          const templatePayloads = templates.map(t => ({
            id: t.id,
            name: t.name,
            is_default: t.isDefault,
            categories: t.categories,
            updated_at: new Date().toISOString()
          }));
          const { error: tError } = await supabase.from('templates').upsert(templatePayloads, { onConflict: 'id' });
          if (tError) {
            console.error('Background sync templates failed:', tError);
            setSyncLogs(prev => [{
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'ERROR',
              details: `Gagal mensinkronkan Template ke Database: ${tError.message || JSON.stringify(tError)}`
            }, ...prev].slice(0, 50));
          }
        }
      } catch (err) {
        console.error('Background sync error:', err);
      }
    };

    const timer = setTimeout(() => {
      handleSync();
    }, 5000); // Debounce 5 seconds

    return () => clearTimeout(timer);
  }, [audits, templates]);

  // 3. Setup Supabase Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session) {
        setIsSessionActive(true);
        localStorage.setItem('si_pesat_session_active', 'true');
        const name = session.user.user_metadata?.full_name || session.user.email || 'Auditor';
        setCustomAuditorName(name);
        
        supabase.from('profiles').select('id, email, full_name, role, nip, golongan, pangkat').then(({ data, error }) => {
          if (!error && data) setUserProfiles(data as UserProfile[]);
        });

        supabase.from('profiles').select('role, is_admin').eq('id', session.user.id).single()
          .then(({ data }) => {
             if (data) {
               if (data.role) setUserRole(data.role as any);
               setIsAdmin(data.is_admin || false);
             }
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session) {
         setIsSessionActive(true);
         localStorage.setItem('si_pesat_session_active', 'true');
         const name = session.user.user_metadata?.full_name || session.user.email || 'Auditor';
         setCustomAuditorName(name);
         
          supabase.from('profiles').select('id, email, full_name, role, nip, golongan, pangkat, bidang_id').then(({ data, error }) => {
           if (!error && data) setUserProfiles(data as UserProfile[]);
         });

         supabase.from('target_entities').select('*').order('type').then(({ data, error }) => {
           if (!error && data) setTargetEntities(data as TargetEntity[]);
         });

          supabase.from('profiles').select('role, is_admin').eq('id', session.user.id).single()
             .then(({ data }) => {
                if (data) {
                  if (data.role) {
                    setUserRole(data.role as any);
                    localStorage.setItem('si_pesat_user_role', data.role);
                  }
                  setIsAdmin(data.is_admin || false);
                  localStorage.setItem('si_pesat_is_admin', JSON.stringify(data.is_admin));
                }
             });

          supabase.from('profiles').select('role, bidang_id, is_admin').eq('id', session.user.id).single().then(({ data }) => {
            if (!data) return;
            const bidangId = data.bidang_id ?? null;
            if (data.is_admin) {
              permissionChecker.setUser(null, bidangId, true);
            } else if (data.role) {
              supabase.from('roles').select('id').eq('name', data.role).single().then(({ data: roleData }) => {
                if (roleData) permissionChecker.setUser(roleData.id, bidangId, false);
              });
            }
            if (bidangId) setUserBidangId(bidangId);
          });

          supabase.from('bidang').select('*').then(({ data }) => {
            if (data) setBidangList(data);
          });
          supabase.from('roles').select('*').then(({ data }) => {
            if (data) setRolesList(data);
          });
          supabase.from('permissions').select('*').then(({ data }) => {
            if (data) {
              setPermissionsList(data);
              const map = new Map<number, string>();
              data.forEach((p: Permission) => map.set(p.id, p.code));
              permissionChecker.setPermissionCodeMap(map);
            }
          });
          supabase.from('role_permissions').select('*').then(({ data }) => {
            if (data) permissionChecker.setRolePermissions(data as RolePermission[]);
          });
      } else {
         setIsSessionActive(false);
         localStorage.removeItem('si_pesat_session_active');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login handlers via Supabase Email/Password
  const handleEmailSignIn = async (email: string, pass: string) => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: pass,
      });
      if (error) throw error;
      showToast(`Berhasil masuk sebagai ${data.user.email}`, 'success');
    } catch (err: any) {
      showToast(`Login gagal: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSessionLogin = (name: string, role: string) => {
    setCustomAuditorName(name);
    setUserRole(role);
    setIsAdmin(false);
    setIsSessionActive(true);
    localStorage.setItem('si_pesat_session_active', 'true');
    localStorage.setItem('si_pesat_custom_name', name);
    localStorage.setItem('si_pesat_user_role', role);
    localStorage.setItem('si_pesat_is_admin', 'false');
    showToast(`Berhasil masuk offline sebagai ${name} (${role})`, 'success');
  };

  const handleSessionLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsSessionActive(false);
    localStorage.removeItem('si_pesat_session_active');
    localStorage.removeItem('si_pesat_custom_name');
    showToast('Telah keluar dari sesi SI-PESAT.', 'info');
  };

  const handleLogin = () => {}; // Alias
  const handleLogout = handleSessionLogout;

  // Log Sync helpers
  const addSyncLog = (type: 'UPLOAD' | 'DOWNLOAD' | 'CREATE_FOLDER' | 'ERROR', description: string, opdName?: string) => {
    const newLog: SyncLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      description,
      opdName
    };
    setSyncLogs(prev => [newLog, ...prev].slice(0, 50)); // limit 50 logs
  };


  // Calculate Progress Helper — berdasarkan item yang sudah ada dokumen bukti (evidenceLink)
  const calculateProgress = (audit: OpdAudit): number => {
    if (audit.status === 'Selesai') return 100;

    let totalItems = 0;
    let uploadedItems = 0;
    audit.categories.forEach(cat => {
      cat.items.forEach(item => {
        totalItems++;
        if (item.evidenceLink && item.evidenceLink.trim() !== '') uploadedItems++;
      });
    });

    if (totalItems === 0) return 0;
    return Math.round((uploadedItems / totalItems) * 100);
  };

  // Audit Crud Actions
  const handleCreateAudit = (
    opdName: string, 
    opdType: OpdAudit['opdType'], 
    _legacyAuditType: string,
    fiscalYear: string, 
    auditorName: string,
    teamMembers: string[],
    templateId: string,
    initialCategoryId?: string,
    customSchedule?: import('./types').AuditMilestone[]
  ) => {
    // Copy checklist structures from active configured template (Requirement A.2)
    const selectedTemplate = templates.find(t => t.id === templateId) || templates[0];
    const auditType = selectedTemplate.name;
    const catsToCopy = initialCategoryId ? selectedTemplate.categories.filter(c => c.id === initialCategoryId) : [];
    const initialCategories: AuditCategory[] = catsToCopy.map(tempCat => {
      return {
        id: tempCat.id,
        name: tempCat.name,
        description: tempCat.description,
        status: 'Draft',
        auditorName: auditorName,
        teamMembers: teamMembers,
        fiscalYear: fiscalYear,
        templateId: templateId,
        categoryId: tempCat.id,
        items: tempCat.items.map(tempItem => {
          return {
            id: tempItem.id,
            title: tempItem.title,
            description: tempItem.description,
            status: 'N/A',
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          };
        })
      };
    });

    const existingAudit = audits.find(a => a.opdName.toLowerCase() === opdName.trim().toLowerCase() && a.fiscalYear === fiscalYear);
    if (existingAudit) {
      const updatedAudit = { ...existingAudit, categories: [...existingAudit.categories, ...initialCategories] };
      setAudits(prev => prev.map(a => a.id === existingAudit.id ? updatedAudit : a));
      setSelectedAuditId(existingAudit.id);
      setActiveTab('workspace');
      showToast('Berhasil menambahkan jenis audit ke berkas yang sudah ada.', 'success');
      return;
    }

    // Generate a valid UUID for Supabase
    const auditId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

    const getFutureDate = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const defaultSchedule = customSchedule || [
      { id: 'milestone_1', name: 'Perencanaan', startDate: new Date().toISOString().split('T')[0], targetDate: getFutureDate(7), status: 'Sedang Berjalan' as const, notes: 'Menyusun Surat Tugas dan KKA awal' },
      { id: 'milestone_2', name: 'Pelaksanaan / KKA', startDate: getFutureDate(7), targetDate: getFutureDate(21), status: 'Belum Mulai' as const, notes: 'Evaluasi dokumen pertanggungjawaban fisik' },
      { id: 'milestone_3', name: 'Penyusunan LHO / LHP', startDate: getFutureDate(21), targetDate: getFutureDate(30), status: 'Belum Mulai' as const, notes: 'Penyusunan laporan hasil pemeriksaan' },
      { id: 'milestone_4', name: 'Pemantauan Tindak Lanjut', startDate: getFutureDate(30), targetDate: getFutureDate(45), status: 'Belum Mulai' as const, notes: 'Verifikasi tindak lanjut atas temuan LHP' }
    ];

    const newAudit: OpdAudit = {
      id: auditId,
      opdName,
      opdType,
      auditType,
      fiscalYear,
      auditorName,
      auditDate: new Date().toISOString().split('T')[0],
      status: 'Draft',
      progress: 0,
      categories: initialCategories,
      teamMembers,
      schedule: defaultSchedule
    };

    setAudits(prev => [newAudit, ...prev]);
    setSelectedAuditId(newAudit.id);
    showToast(`Pemeriksaan KKA ${opdName} berhasil diinisiasi.`, 'success');
  };

  const handleUpdateAudit = (updatedAudit: OpdAudit) => {
    setAudits(prev => prev.map(a => a.id === updatedAudit.id ? updatedAudit : a));
    
    // Auto sync to Drive in background if it has already been synced once
    // Auto sync to Drive in background is now handled by Supabase effect
  };

  const handleDeleteAudit = async (auditId: string) => {
    setAudits(prev => prev.filter(a => a.id !== auditId));
    if (selectedAuditId === auditId) {
      setSelectedAuditId(null);
    }
    if (navigator.onLine) {
      supabase.from('audits').delete().eq('id', auditId).then(({ error }) => {
        if (error) console.error("Error deleting audit from Supabase", error);
      });
    }
    showToast('KKA Berhasil dihapus.', 'info');
  };

  // Push single Audit to Drive
  const syncSingleToDrive = async (audit: OpdAudit, silent = false) => {
    // Legacy function. Supabase handles sync automatically.
    if (!silent) showToast('Data disinkronkan otomatis melalui Supabase.', 'info');
  };

  // batch sync all local audits
  const batchSyncAllToDrive = async () => {
    showToast('Semua data sudah disinkronkan otomatis.', 'success');
  };

  // pull from Drive
  const fetchAllFromDrive = async () => {
    showToast('Data ditarik otomatis saat login awal.', 'info');
  };

  const activeAudit = audits.find(a => a.id === selectedAuditId);

  // App Layout tabs rendering
  const renderContent = () => {
    if (selectedAuditId && activeAudit) {
      return (
        <AuditWorkspaceView templates={templates}
          audit={activeAudit}
          onBack={() => navigateTo('pengawasan')}
          onUpdates={handleUpdateAudit}
          onSync={(aud) => addSyncLog('UPLOAD', 'Pembaruan disimpan lokal.')}
          isDriveConnected={true}
          isSyncing={isSyncing}
          userRole={userRole}
          isAdmin={isAdmin}
          userProfiles={userProfiles}
          onShowToast={showToast}
          currentUserName={userProfiles.find(p => p.id === user?.id)?.full_name || user?.user_metadata?.full_name || user?.email || ''}
          initialCategoryId={selectedCategoryId}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <HomeView targetEntities={targetEntities} audits={audits} onSelectAudit={(aud, catId) => navigateTo(catId ? `workspace/${aud.id}/${catId}` : `workspace/${aud.id}`)} userRole={userRole} isAdmin={isAdmin} />;
      case 'pengawasan':
        return (
          <div className="space-y-4">
            {/* Sub-tab navigation for Pengawasan — mobile only */}
            <div className="md:hidden flex items-center gap-1 bg-white rounded-xl border border-dark-gray/10 p-1 shadow-xs overflow-x-auto">
              <button
                onClick={() => navigateToPengawasan('audit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-xs whitespace-nowrap ${
                  pengawasanSubTab === 'audit'
                    ? 'bg-peach-accent text-dark-gray shadow-sm border border-dark-gray/5'
                    : 'text-dark-gray/60 hover:text-dark-gray hover:bg-slate-50'
                }`}
              >
                <FileCheck className="w-4 h-4" /> Audit
              </button>
              <button
                onClick={() => navigateToPengawasan('reviu')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-xs whitespace-nowrap ${
                  pengawasanSubTab === 'reviu'
                    ? 'bg-peach-accent text-dark-gray shadow-sm border border-dark-gray/5'
                    : 'text-dark-gray/60 hover:text-dark-gray hover:bg-slate-50'
                }`}
              >
                <FolderSync className="w-4 h-4" /> Reviu
              </button>
              <button
                onClick={() => navigateToPengawasan('evaluasi')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-xs whitespace-nowrap ${
                  pengawasanSubTab === 'evaluasi'
                    ? 'bg-peach-accent text-dark-gray shadow-sm border border-dark-gray/5'
                    : 'text-dark-gray/60 hover:text-dark-gray hover:bg-slate-50'
                }`}
              >
                <TrendingDown className="w-4 h-4" /> Evaluasi
              </button>
              <button
                onClick={() => navigateToPengawasan('asistensi')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-xs whitespace-nowrap ${
                  pengawasanSubTab === 'asistensi'
                    ? 'bg-peach-accent text-dark-gray shadow-sm border border-dark-gray/5'
                    : 'text-dark-gray/60 hover:text-dark-gray hover:bg-slate-50'
                }`}
              >
                <Cloud className="w-4 h-4" /> Asistensi
              </button>
            </div>

            {/* Sub-tab content */}
            {pengawasanSubTab === 'audit' && (
              <AuditListView
                audits={audits}
                templates={templates}
                targetEntities={targetEntities}
                onSelectAudit={(aud, catId) => navigateTo(catId ? `workspace/${aud.id}/${catId}` : `workspace/${aud.id}`)}
                onCreateAudit={handleCreateAudit}
                onDeleteAudit={handleDeleteAudit}
                onSyncToDrive={(aud) => addSyncLog('UPLOAD', 'Pembaruan disimpan lokal.')}
                isDriveConnected={true}
                userRole={userRole}
                isAdmin={isAdmin}
                defaultAuditorName={userProfiles.find(p => p.id === user?.id)?.full_name || user?.user_metadata?.full_name || user?.email || customAuditorName || ''}
                userProfiles={userProfiles}
              />
            )}
            {pengawasanSubTab === 'reviu' && (
              <ReviuView
                audits={audits}
                onSelectAudit={(aud, catId) => navigateTo(catId ? `workspace/${aud.id}/${catId}` : `workspace/${aud.id}`)}
              />
            )}
            {pengawasanSubTab === 'evaluasi' && (
              <EvaluasiView
                audits={audits}
                onSelectAudit={(aud, catId) => navigateTo(catId ? `workspace/${aud.id}/${catId}` : `workspace/${aud.id}`)}
              />
            )}
            {pengawasanSubTab === 'asistensi' && (
              <AsistensiView
                audits={audits}
                onSelectAudit={(aud, catId) => navigateTo(catId ? `workspace/${aud.id}/${catId}` : `workspace/${aud.id}`)}
              />
            )}
          </div>
        );
      case 'new-audit':
        return (
          <NewAuditView
            audits={audits}
            templates={templates}
            userProfiles={userProfiles}
            targetEntities={targetEntities}
            defaultAuditorName={userProfiles.find(p => p.id === user?.id)?.full_name || user?.user_metadata?.full_name || user?.email || ''}
            onBack={() => navigateTo('pengawasan')}
            onCreateAudit={(opdName, opdType, legacy, fiscalYear, auditorName, teamMembers, templateId, catId, schedule) => {
              handleCreateAudit(opdName, opdType, legacy, fiscalYear, auditorName, teamMembers, templateId, catId, schedule);
              navigateTo('pengawasan');
            }}
          />
        );
      case 'wilayah-penugasan':
        return (
          <WilayahPenugasanView
            targetEntities={targetEntities}
            audits={audits}
            onSelectAudit={(aud, catId) => navigateTo(catId ? `workspace/${aud.id}/${catId}` : `workspace/${aud.id}`)}
            userRole={userRole}
            isAdmin={isAdmin}
          />
        );
      case 'statistik':
        return <StatistikView audits={audits} userRole={userRole} />;
      case 'pengguna':
        return (
          <UserManagementView
            userProfiles={userProfiles}
            currentUserRole={userRole}
            isAdmin={isAdmin}
            currentUserId={user?.id}
            bidangList={bidangList}
            onShowToast={showToast}
            onRefreshProfiles={() => {
              supabase.from('profiles').select('id, email, full_name, role, nip, golongan, pangkat, bidang_id').then(({ data, error }) => {
                if (!error && data) setUserProfiles(data as UserProfile[]);
              });
            }}
          />
        );
      case 'role-permission':
        return (
          <RolePermissionView
            rolesList={rolesList}
            permissionsList={permissionsList}
            bidangList={bidangList}
            onShowToast={showToast}
          />
        );
      case 'profil':
        return (
          <UserProfileView
            currentUser={userProfiles.find(p => p.id === user?.id) || null}
            userRole={userRole}
            isAdmin={isAdmin}
            audits={audits}
            onSelectAudit={(aud, catId) => navigateTo(catId ? `workspace/${aud.id}/${catId}` : `workspace/${aud.id}`)}
          />
        );
      case 'jenis-audit':
        return (
          <TemplateConfiguratorView
            templates={templates}
            onUpdateTemplates={setTemplates}
            onDeleteTemplate={(id) => {
              if (navigator.onLine) {
                supabase.from('templates').delete().eq('id', id).then();
              }
            }}
            onResetTemplates={() => {
              setTemplates([EMPTY_KKA_TEMPLATE]);
              showToast('Template master diatur ulang ke standar juknis.', 'info');
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg font-sans text-dark-gray flex flex-col pt-0 pb-16 md:pb-0" id="si-pesat-app">
      
      {/* Toast alert wrapper */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            id="toast-notification"
            className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 border ${
              toast.type === 'error' 
                ? 'bg-red-50 border-red-200 text-red-900' 
                : toast.type === 'info' 
                  ? 'bg-blue-50 border-blue-200 text-blue-900' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {toast.type === 'error' ? (
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            <span className="text-xs font-semibold leading-snug">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSessionActive ? (
        <LoginView
          onEmailSignIn={handleEmailSignIn}
          isSyncing={isSyncing}
        />
      ) : (
        /* Main Container Wrapper */
        <div className="flex flex-col flex-1 relative bg-cream-bg text-dark-gray h-screen">
          
          {/* Top Navigation Header */}
          <header className="bg-baby-blue border-b border-dark-gray/10 px-4 md:px-8 py-3 sticky top-0 z-40 flex items-center justify-between shadow-xs">
            {/* Logo Left */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-peach-accent text-dark-gray flex items-center justify-center font-extrabold text-sm shadow-xs border border-dark-gray/10">
                I
              </div>
              <div>
                <h1 className="font-extrabold text-sm md:text-base text-dark-gray tracking-tight">SI-PESAT</h1>
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-dark-gray/70 font-bold block leading-none">Inspektorat Kabupaten Sumba Barat</span>
              </div>
            </div>

            {/* Desktop Center Navigation Menu */}
            <nav className="hidden md:flex items-center gap-2">
              <button
                onClick={() => navigateTo('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${
                  activeTab === 'dashboard' && !selectedAuditId
                    ? 'bg-peach-accent text-dark-gray shadow-sm border border-dark-gray/5' 
                    : 'text-dark-gray/70 hover:bg-white/40 hover:text-dark-gray'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Beranda
              </button>
              <button
                onClick={() => navigateTo('wilayah-penugasan')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${
                  activeTab === 'wilayah-penugasan'
                    ? 'bg-peach-accent text-dark-gray shadow-sm border border-dark-gray/5' 
                    : 'text-dark-gray/70 hover:bg-white/40 hover:text-dark-gray'
                }`}
              >
                <Building className="w-4 h-4" /> Wilayah Penugasan
              </button>
              <div className="relative" onMouseEnter={() => handleDropdownEnter('pengawasan')} onMouseLeave={() => handleDropdownLeave('pengawasan')}>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${
                    activeTab === 'pengawasan' || selectedAuditId
                      ? 'bg-peach-accent text-dark-gray shadow-sm border border-dark-gray/5' 
                      : 'text-dark-gray/70 hover:bg-white/40 hover:text-dark-gray'
                  }`}
                >
                  <School className="w-4 h-4" /> Pengawasan <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>
                {/* Dropdown Menu */}
                {openDropdowns['pengawasan'] && (
                  <div className="absolute top-full left-0 bg-white rounded-xl shadow-xl border border-dark-gray/10 py-1 min-w-[200px] z-50" onMouseEnter={() => handleDropdownEnter('pengawasan')} onMouseLeave={() => handleDropdownLeave('pengawasan')}>
                    {/* Audit with nested dropdown */}
                    <div className="relative" onMouseEnter={() => handleDropdownEnter('audit-nested')} onMouseLeave={() => handleDropdownLeave('audit-nested')}>
                      <button
                        onClick={() => navigateToPengawasan('audit')}
                        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-bold text-dark-gray hover:bg-peach-accent/20 transition rounded-lg"
                      >
                        <span className="flex items-center gap-2"><FileCheck className="w-4 h-4" /> Audit</span>
                        <ChevronDown className="w-3 h-3 -rotate-90" />
                      </button>
                      {/* Nested: KKA & Statistik KKA */}
                      {openDropdowns['audit-nested'] && (
                        <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-xl border border-dark-gray/10 py-1 min-w-[180px] z-50" onMouseEnter={() => handleDropdownEnter('audit-nested')} onMouseLeave={() => handleDropdownLeave('audit-nested')}>
                          <button
                            onClick={() => navigateToPengawasan('audit')}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-dark-gray hover:bg-peach-accent/20 transition rounded-lg flex items-center gap-2"
                          >
                            <FileCheck className="w-4 h-4" /> KKA
                          </button>
                          <button
                            onClick={() => { setActiveTab('pengawasan'); setPengawasanSubTab('audit'); navigateTo('statistik'); }}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-dark-gray hover:bg-peach-accent/20 transition rounded-lg flex items-center gap-2"
                          >
                            <PieChart className="w-4 h-4" /> Statistik KKA
                          </button>
                          <button
                            onClick={() => navigateTo('jenis-audit')}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-dark-gray hover:bg-peach-accent/20 transition rounded-lg flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" /> Jenis Audit
                          </button>
                        </div>
                      )}
                    </div>
                    <hr className="border-dark-gray/5 my-1" />
                    <button
                      onClick={() => navigateToPengawasan('reviu')}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-dark-gray hover:bg-peach-accent/20 transition rounded-lg"
                    >
                      <FolderSync className="w-4 h-4" /> Reviu
                    </button>
                    <hr className="border-dark-gray/5 my-1" />
                    <button
                      onClick={() => navigateToPengawasan('evaluasi')}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-dark-gray hover:bg-peach-accent/20 transition rounded-lg"
                    >
                      <TrendingDown className="w-4 h-4" /> Evaluasi
                    </button>
                    <hr className="border-dark-gray/5 my-1" />
                    <button
                      onClick={() => navigateToPengawasan('asistensi')}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-dark-gray hover:bg-peach-accent/20 transition rounded-lg"
                    >
                      <Cloud className="w-4 h-4" /> Asistensi
                    </button>
                  </div>
                )}
              </div>
              {(isAdmin || permissionChecker.can('user.manage') || permissionChecker.can('role.manage')) && (
                <div className="relative" onMouseEnter={() => handleDropdownEnter('pengaturan')} onMouseLeave={() => handleDropdownLeave('pengaturan')}>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${
                      activeTab === 'pengguna' || activeTab === 'role-permission'
                        ? 'bg-peach-accent text-dark-gray shadow-sm border border-dark-gray/5' 
                        : 'text-dark-gray/70 hover:bg-white/40 hover:text-dark-gray'
                    }`}
                  >
                    <Settings className="w-4 h-4" /> Pengaturan <ChevronDown className="w-3 h-3 ml-0.5" />
                  </button>
                  {openDropdowns['pengaturan'] && (
                    <div className="absolute top-full left-0 bg-white rounded-xl shadow-xl border border-dark-gray/10 py-1 min-w-[180px] z-50" onMouseEnter={() => handleDropdownEnter('pengaturan')} onMouseLeave={() => handleDropdownLeave('pengaturan')}>
                      {(isAdmin || permissionChecker.can('user.manage')) && (
                        <button
                          onClick={() => navigateTo('pengguna')}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-dark-gray hover:bg-peach-accent/20 transition rounded-lg"
                        >
                          <UserIcon className="w-4 h-4" /> Pengguna
                        </button>
                      )}
                      {(isAdmin || permissionChecker.can('role.manage')) && (
                        <button
                          onClick={() => navigateTo('role-permission')}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-dark-gray hover:bg-peach-accent/20 transition rounded-lg"
                        >
                          <ShieldAlert className="w-4 h-4" /> Role & Permission
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Mulai Audit Baru CTA */}
            <button
              onClick={() => navigateTo('new-audit')}
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-black text-xs border shadow-sm ${
                activeTab === 'new-audit'
                  ? 'bg-dark-gray text-white border-dark-gray'
                  : 'bg-dark-gray text-white border-dark-gray/80 hover:bg-dark-gray/85'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Mulai Pengawasan Baru
            </button>

            {/* Right Profile & Role */}
            <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] font-black bg-peach-accent text-dark-gray px-2 py-0.5 rounded-sm border border-dark-gray/10 shadow-xs uppercase tracking-wider mb-0.5">
            {userRole === 'Inspektur' ? '👑 Inspektur' : userRole === 'Inspektur Pembantu' ? '🔍 Irban' : userRole}
            </span>
            <button
                onClick={() => navigateTo('profil')}
                  className="text-xs font-bold text-dark-gray hover:text-dark-gray/70 hover:underline transition-colors"
                >
                  {userProfiles.find(p => p.id === user?.id)?.full_name || user?.user_metadata?.full_name || user?.email || customAuditorName || 'Auditor'}
                </button>
              </div>
              
              {/* Mobile compact role */}
              <span className="md:hidden text-[10px] font-black bg-peach-accent text-dark-gray px-2 py-1 rounded-md border border-dark-gray/10 shadow-xs">
                {userRole === 'Inspektur' ? '👑 Inspektur' : userRole === 'Inspektur Pembantu' ? '🔍 Irban' : userRole}
              </span>

              <button
                onClick={handleSessionLogout}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold flex items-center justify-center transition-colors"
                title="Keluar Sesi"
              >
                <X className="w-4 h-4 md:hidden" />
                <span className="hidden md:inline">Keluar</span>
              </button>
            </div>
          </header>

          {/* Content View pane wrapper */}
          <main className="flex-1 flex flex-col min-w-0 bg-cream-bg overflow-y-auto w-full relative">

            {/* Core Body Container Frame */}
            <div className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-[1800px] mx-auto transition-all">
              {renderContent()}
            </div>
          </main>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar — maks 5 item, admin items masuk "Lainnya" */}
      {isSessionActive && (
        <>
          {/* Sheet overlay untuk "Lainnya" */}
          {isMobileMoreOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm block md:hidden"
              onClick={() => setIsMobileMoreOpen(false)}
            >
              <div
                className="absolute bottom-16 left-2 right-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 pt-3 pb-1">Menu Lainnya</p>

                {/* Wilayah Penugasan */}
                <button
                  onClick={() => { navigateTo('wilayah-penugasan'); setIsMobileMoreOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition hover:bg-slate-50 ${
                    activeTab === 'wilayah-penugasan' ? 'text-dark-gray bg-peach-accent/10' : 'text-slate-600'
                  }`}
                >
                  <Building className="w-4 h-4" /> Wilayah Penugasan
                </button>

                {/* Statistik */}
                <button
                  onClick={() => { navigateTo('statistik'); setIsMobileMoreOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition hover:bg-slate-50 ${
                    activeTab === 'statistik' ? 'text-dark-gray bg-peach-accent/10' : 'text-slate-600'
                  }`}
                >
                  <PieChart className="w-4 h-4" /> Statistik
                </button>

                {/* Jenis Audit — hanya admin/Inspektur */}
                {(userRole === 'Inspektur' || userRole === 'Inspektur Pembantu' || isAdmin) && (
                  <button
                    onClick={() => { navigateTo('jenis-audit'); setIsMobileMoreOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition hover:bg-slate-50 ${
                      activeTab === 'jenis-audit' ? 'text-dark-gray bg-peach-accent/10' : 'text-slate-600'
                    }`}
                  >
                    <Settings className="w-4 h-4" /> Jenis Audit
                  </button>
                )}

                {/* Pengguna — hanya admin/Inspektur */}
                {permissionChecker.can('user.manage') && (
                  <button
                    onClick={() => { navigateTo('pengguna'); setIsMobileMoreOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition hover:bg-slate-50 ${
                      activeTab === 'pengguna' ? 'text-dark-gray bg-peach-accent/10' : 'text-slate-600'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" /> Pengguna
                  </button>
                )}
                {permissionChecker.can('role.manage') && (
                  <button
                    onClick={() => { navigateTo('role-permission'); setIsMobileMoreOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition hover:bg-slate-50 ${
                      activeTab === 'role-permission' ? 'text-dark-gray bg-peach-accent/10' : 'text-slate-600'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" /> Role & Permission
                  </button>
                )}

                <div className="h-3" />
              </div>
            </div>
          )}

          <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 block md:hidden shadow-lg h-16 pb-safe">
            <div className="grid grid-cols-5 h-full">

              {/* Beranda */}
              <button
                onClick={() => { navigateTo('dashboard'); setIsMobileMoreOpen(false); }}
                className={`flex flex-col items-center justify-center gap-1 transition ${
                  activeTab === 'dashboard' && !selectedAuditId ? 'text-dark-gray font-bold' : 'text-slate-400'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-[9px] tracking-wide">Beranda</span>
              </button>

              {/* Pengawasan */}
              <button
                onClick={() => { navigateTo('pengawasan'); setIsMobileMoreOpen(false); }}
                className={`flex flex-col items-center justify-center gap-1 transition ${
                  activeTab === 'pengawasan' || selectedAuditId ? 'text-dark-gray font-bold' : 'text-slate-400'
                }`}
              >
                <School className="w-5 h-5" />
                <span className="text-[9px] tracking-wide">Pengawasan</span>
              </button>

              {/* Buat KKA — tengah, menonjol */}
              <button
                onClick={() => { navigateTo('new-audit'); setIsMobileMoreOpen(false); }}
                className="flex flex-col items-center justify-center gap-1 transition"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition ${
                  activeTab === 'new-audit' ? 'bg-dark-gray' : 'bg-dark-gray/85'
                }`}>
                  <PlusCircle className="w-5 h-5 text-white" />
                </div>
                <span className={`text-[9px] tracking-wide ${
                  activeTab === 'new-audit' ? 'text-dark-gray font-bold' : 'text-slate-400'
                }`}>Buat KKA</span>
              </button>

              {/* Profil */}
              <button
                onClick={() => { navigateTo('profil'); setIsMobileMoreOpen(false); }}
                className={`flex flex-col items-center justify-center gap-1 transition ${
                  activeTab === 'profil' ? 'text-dark-gray font-bold' : 'text-slate-400'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span className="text-[9px] tracking-wide">Profil</span>
              </button>

              {/* Lainnya */}
              <button
                onClick={() => setIsMobileMoreOpen(v => !v)}
                className={`flex flex-col items-center justify-center gap-1 transition relative ${
                  isMobileMoreOpen || ['statistik', 'jenis-audit', 'pengguna', 'role-permission', 'wilayah-penugasan'].includes(activeTab)
                    ? 'text-dark-gray font-bold'
                    : 'text-slate-400'
                }`}
              >
                <Menu className="w-5 h-5" />
                <span className="text-[9px] tracking-wide">Lainnya</span>
                {/* Dot indikator kalau sedang di salah satu halaman "Lainnya" */}
                {['statistik', 'jenis-audit', 'pengguna', 'role-permission', 'wilayah-penugasan'].includes(activeTab) && (
                  <span className="absolute top-2 right-4 w-1.5 h-1.5 bg-peach-accent rounded-full" />
                )}
              </button>

            </div>
          </footer>
        </>
      )}

    </div>
  );
}
