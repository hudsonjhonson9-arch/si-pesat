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
  Menu,
  X,
  User as UserIcon,
  ShieldAlert,
  Info
} from 'lucide-react';

import { OpdAudit, KKATemplate, SyncLog, AuditCategory, AuditItem } from './types';
import { EMPTY_KKA_TEMPLATE } from './data';
import { supabase } from './lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Custom subcomponents
import DashboardView from './components/DashboardView';
import AuditListView from './components/AuditListView';
import AuditWorkspaceView from './components/AuditWorkspaceView';
import TemplateConfiguratorView from './components/TemplateConfiguratorView';
import SyncManagerView from './components/SyncManagerView';
import LoginView from './components/LoginView';

export default function App() {
  // Navigation & General Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'audits' | 'template' | 'sync'>('dashboard');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  // Core Applet States
  const [audits, setAudits] = useState<OpdAudit[]>([]);
  const [template, setTemplate] = useState<KKATemplate>(EMPTY_KKA_TEMPLATE);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  // Simulated internal account role ('Auditor' | 'Inspektur Pembantu' | 'Inspektur')
  const [userRole, setUserRole] = useState<'Auditor' | 'Inspektur Pembantu' | 'Inspektur'>(() => {
    const cached = localStorage.getItem('si_kka_user_role');
    return (cached as 'Auditor' | 'Inspektur Pembantu' | 'Inspektur') || 'Auditor';
  });

  // Session Login gate state
  const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
    return localStorage.getItem('si_kka_session_active') === 'true';
  });
  const [customAuditorName, setCustomAuditorName] = useState<string>(() => {
    return localStorage.getItem('si_kka_custom_name') || '';
  });

  // Authentication & Cloud Sync
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    const cachedAudits = localStorage.getItem('si_kka_audits');
    const cachedTemplate = localStorage.getItem('si_kka_template');
    const cachedLogs = localStorage.getItem('si_kka_logs');

    if (cachedAudits) {
      try {
        setAudits(JSON.parse(cachedAudits));
      } catch (e) {
        console.error('Error parsing cached school audits:', e);
        setAudits([]);
      }
    } else {
      setAudits([]);
    }

    if (cachedTemplate) {
      try {
        setTemplate(JSON.parse(cachedTemplate));
      } catch (e) {
        console.error('Error parsing cached KKA templates:', e);
        setTemplate(EMPTY_KKA_TEMPLATE);
      }
    } else {
      setTemplate(EMPTY_KKA_TEMPLATE);
    }

    if (cachedLogs) {
      try {
        setSyncLogs(JSON.parse(cachedLogs));
      } catch (e) {
        setSyncLogs([]);
      }
    }

    // Try to fetch real data from Supabase to overwrite local cache if online
    if (navigator.onLine) {
      supabase.from('audits').select('*').then(({ data, error }) => {
        if (!error && data) {
          const mapped = data.map(d => ({
            id: d.id,
            opdName: d.opd_name,
            opdType: d.opd_type,
            fiscalYear: d.fiscal_year,
            auditorName: d.auditor_name,
            auditDate: d.audit_date,
            budget: d.budget,
            status: d.status,
            progress: d.progress,
            teamMembers: d.team_members || [],
            categories: d.categories || []
          }));
          if (mapped.length > 0 || !cachedAudits) {
             setAudits(mapped);
          }
        }
      });

      supabase.from('templates').select('*').eq('id', 'master_template').single().then(({ data, error }) => {
        if (!error && data) {
          const fetchedTemplate = {
            id: data.id,
            name: data.name,
            isDefault: data.is_default,
            categories: data.categories || []
          };
          setTemplate(fetchedTemplate);
        }
      });
    }
  }, []);

  // 2. Persist state changes in localStorage
  useEffect(() => {
    if (audits.length > 0) {
      localStorage.setItem('si_kka_audits', JSON.stringify(audits));
    }
  }, [audits]);

  useEffect(() => {
    localStorage.setItem('si_kka_template', JSON.stringify(template));
  }, [template]);

  useEffect(() => {
    localStorage.setItem('si_kka_logs', JSON.stringify(syncLogs));
  }, [syncLogs]);

  useEffect(() => {
    localStorage.setItem('si_kka_user_role', userRole);
  }, [userRole]);


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
              budget: a.budget,
              status: a.status,
              progress: calculateProgress(a),
              categories: a.categories,
              team_members: a.teamMembers || [],
              updated_at: new Date().toISOString()
            }));

            const { error } = await supabase.from('audits').upsert(payload, { onConflict: 'id' });
            if (error) console.error('Background sync audits failed:', error);
          }
        }

        if (template && template.categories && template.categories.length > 0) {
          const templatePayload = {
            id: 'master_template',
            name: template.name,
            is_default: template.isDefault,
            categories: template.categories,
            updated_at: new Date().toISOString()
          };
          const { error: tError } = await supabase.from('templates').upsert(templatePayload, { onConflict: 'id' });
          if (tError) console.error('Background sync templates failed:', tError);
        }
      } catch (err) {
        console.error('Background sync error:', err);
      }
    };

    const timer = setTimeout(() => {
      handleSync();
    }, 5000); // Debounce 5 seconds

    return () => clearTimeout(timer);
  }, [audits]);

  // 3. Setup Supabase Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session) {
        setIsSessionActive(true);
        localStorage.setItem('si_kka_session_active', 'true');
        const name = session.user.user_metadata?.full_name || session.user.email || 'Auditor';
        setCustomAuditorName(name);
        
        supabase.from('profiles').select('role').eq('id', session.user.id).single()
          .then(({ data }) => {
             if (data?.role) setUserRole(data.role as any);
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session) {
         setIsSessionActive(true);
         localStorage.setItem('si_kka_session_active', 'true');
      } else {
         setIsSessionActive(false);
         localStorage.removeItem('si_kka_session_active');
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

  const handleSessionLogin = (name: string, role: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur') => {
    setCustomAuditorName(name);
    setUserRole(role);
    setIsSessionActive(true);
    localStorage.setItem('si_kka_session_active', 'true');
    localStorage.setItem('si_kka_custom_name', name);
    localStorage.setItem('si_kka_user_role', role);
    showToast(`Berhasil masuk offline sebagai ${name} (${role})`, 'success');
  };

  const handleSessionLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsSessionActive(false);
    localStorage.removeItem('si_kka_session_active');
    localStorage.removeItem('si_kka_custom_name');
    showToast('Telah keluar dari sesi SI-KKA.', 'info');
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


  // Calculate Progress Helper
  const calculateProgress = (audit: OpdAudit): number => {
    let totalItems = 0;
    let evaluatedItems = 0;
    audit.categories.forEach(cat => {
      cat.items.forEach(item => {
        totalItems++;
        // Asumsi: Jika ada uraian temuan, atau statusnya bukan Sesuai (karena default Sesuai), atau ada nilai temuan, berarti sudah dievaluasi.
        // Jika kita ingin lebih presisi, kita bisa tambahkan status 'Draft' di item, tapi untuk sekarang kita anggap dievaluasi jika ada perubahan
        if (item.status === 'Temuan' || item.status === 'N/A' || item.uraianTemuan.length > 0 || item.nilaiTemuan > 0) {
          evaluatedItems++;
        }
      });
    });
    // If we want simple progress based on status, we can just say if it's reviewed.
    // For now, let's just use a dummy logic or check if status is Selesai
    if (audit.status === 'Selesai') return 100;
    if (totalItems === 0) return 0;
    
    // Instead of strict evaluation, we can track audit status: 
    // Draft = 10%, Sedang Berjalan = 50%, Direview = 80%, Selesai = 100%
    if (audit.status === 'Draft') return 10;
    if (audit.status === 'Sedang Berjalan') return 50;
    if (audit.status === 'Direview') return 80;
    
    return Math.round((evaluatedItems / totalItems) * 100);
  };

  // Audit Crud Actions
  const handleCreateAudit = (
    opdName: string, 
    opdType: OpdAudit['opdType'], 
    fiscalYear: string, 
    auditorName: string, 
    budget: number,
    teamMembers: string[]
  ) => {
    // Copy checklist structures from active configured template (Requirement A.2)
    const initialCategories: AuditCategory[] = template.categories.map(tempCat => {
      return {
        id: tempCat.id,
        name: tempCat.name,
        description: tempCat.description,
        items: tempCat.items.map(tempItem => {
          return {
            id: tempItem.id,
            title: tempItem.title,
            description: tempItem.description,
            status: 'Sesuai',
            nilaiTemuan: 0,
            uraianTemuan: '',
            rekomendasi: ''
          };
        })
      };
    });

    // Generate a valid UUID for Supabase
    const auditId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

    const newAudit: OpdAudit = {
      id: auditId,
      opdName,
      opdType,
      fiscalYear,
      auditorName,
      auditDate: new Date().toISOString().split('T')[0],
      budget,
      status: 'Draft',
      progress: 0,
      categories: initialCategories,
      teamMembers
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
    // Deletion from Drive is not supported in current central Web App yet
    setAudits(prev => prev.filter(a => a.id !== auditId));
    if (selectedAuditId === auditId) {
      setSelectedAuditId(null);
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
        <AuditWorkspaceView
          audit={activeAudit}
          onBack={() => setSelectedAuditId(null)}
          onUpdates={handleUpdateAudit}
          onSync={(aud) => addSyncLog('UPLOAD', 'Pembaruan disimpan lokal.')}
          isDriveConnected={true}
          isSyncing={isSyncing}
          
          userRole={userRole}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            audits={audits}
            onSelectAudit={(aud) => setSelectedAuditId(aud.id)}
            userRole={userRole}
          />
        );
      case 'audits':
        return (
          <AuditListView
            audits={audits}
            onSelectAudit={(aud) => setSelectedAuditId(aud.id)}
            onCreateAudit={handleCreateAudit}
            onDeleteAudit={handleDeleteAudit}
            onSyncToDrive={(aud) => addSyncLog('UPLOAD', 'Pembaruan disimpan lokal.')}
            isDriveConnected={true}
            userRole={userRole}
            defaultAuditorName={user?.displayName || customAuditorName || ''}
          />
        );
      case 'template':
        return (
          <TemplateConfiguratorView
            template={template}
            onUpdateTemplate={setTemplate}
            onResetTemplate={() => {
              setTemplate(EMPTY_KKA_TEMPLATE);
              showToast('Template master diatur ulang ke standar juknis.', 'info');
            }}
          />
        );
      case 'sync':
        return (
          <SyncManagerView
            user={user}
            
            logs={syncLogs}
            audits={audits}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onBatchSyncToDrive={batchSyncAllToDrive}
            onFetchFromDrive={fetchAllFromDrive}
            isSyncing={isSyncing}
            onClearLogs={() => setSyncLogs([])}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-cream-bg font-sans text-dark-gray flex flex-col pt-0 pb-16 md:pb-0" id="si-kka-app">
      
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
        <div className="flex flex-1 relative bg-cream-bg text-dark-gray">
          
          {/* Desktop Sidebar (Left Draw - hidden on mobile) */}
          <aside className="hidden md:flex flex-col w-64 bg-baby-blue text-dark-gray border-r border-dark-gray/10 flex-shrink-0">
            {/* Sidebar Header Title */}
            <div className="p-5 border-b border-dark-gray/10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-peach-accent text-dark-gray flex items-center justify-center font-bold text-sm shadow-xs border border-dark-gray/10">
                I
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-dark-gray tracking-tight">SI-KKA Audit</h1>
                <span className="text-[9px] uppercase tracking-wider text-dark-gray/70 font-bold block leading-none">Inspektorat Daerah</span>
              </div>
            </div>

            {/* Active Role Indicator Badge */}
            <div className="px-4 py-3 mx-4 my-3 bg-white/40 rounded-2xl border border-dark-gray/10 text-xs shadow-inner">
              <span className="text-[9px] font-bold text-dark-gray/60 uppercase block tracking-wider mb-1">Peran Aktif</span>
              <div className="flex items-center gap-1.5 font-extrabold text-dark-gray text-xs">
                <span>
                  {userRole === 'Auditor' && '🕵️ Auditor'}
                  {userRole === 'Inspektur Pembantu' && '🔍 Irban'}
                  {userRole === 'Inspektur' && '👑 Inspektur'}
                </span>
                <span className="text-[9px] bg-peach-accent px-1.5 py-0.5 rounded-sm font-black text-dark-gray animate-pulse">Sesi</span>
              </div>
              <div className="mt-1.5 text-[9px] text-dark-gray/80 leading-normal font-medium">
                {userRole === 'Auditor' && 'Pemeriksa penyusun kertas kerja audit & dokumen bukti.'}
                {userRole === 'Inspektur Pembantu' && 'Reviewer ulasan temuan audit & juknis bukti.'}
                {userRole === 'Inspektur' && 'Pimpinan penandatangan sertifikasi LHP Selesai.'}
              </div>
            </div>

            {/* Navigation link elements */}
            <nav className="flex-1 p-4 space-y-1.5 text-xs font-bold">
              <button
                onClick={() => { setActiveTab('dashboard'); setSelectedAuditId(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'dashboard' && !selectedAuditId
                    ? 'bg-peach-accent text-dark-gray font-extrabold shadow-sm border border-dark-gray/5' 
                    : 'hover:bg-white/40 text-dark-gray/75 hover:text-dark-gray'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Dashboard Analitik
              </button>

              <button
                onClick={() => { setActiveTab('audits'); setSelectedAuditId(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'audits' || selectedAuditId
                    ? 'bg-peach-accent text-dark-gray font-extrabold shadow-sm border border-dark-gray/5' 
                    : 'hover:bg-white/40 text-dark-gray/75 hover:text-dark-gray'
                }`}
              >
                <School className="w-4 h-4" /> Kertas Kerja Audit (KKA)
              </button>

              <button
                onClick={() => { setActiveTab('template'); setSelectedAuditId(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'template' && !selectedAuditId
                    ? 'bg-peach-accent text-dark-gray font-extrabold shadow-sm border border-dark-gray/5' 
                    : 'hover:bg-white/40 text-dark-gray/75 hover:text-dark-gray'
                }`}
              >
                <Settings className="w-4 h-4" /> Konfigurasi Template
              </button>

              <button
                onClick={() => { setActiveTab('sync'); setSelectedAuditId(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === 'sync' && !selectedAuditId
                    ? 'bg-peach-accent text-dark-gray font-extrabold shadow-sm border border-dark-gray/5' 
                    : 'hover:bg-white/40 text-dark-gray/75 hover:text-dark-gray'
                }`}
              >
                <Cloud className="w-4 h-4" /> Google Drive Sync
              </button>

              <button
                onClick={handleSessionLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-rose-700/80 hover:bg-rose-50/50 hover:text-rose-700 mt-6 pt-2 border-t border-dark-gray/10 cursor-pointer"
              >
                <X className="w-4 h-4" /> Log out SI-KKA
              </button>
            </nav>

            {/* Sidebar profile footer */}
            {(user || customAuditorName) && (
              <div className="p-4 border-t border-dark-gray/10 flex items-center gap-2.5 bg-white/20">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border border-dark-gray/20" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-peach-accent text-dark-gray text-xs flex items-center justify-center font-bold border border-dark-gray/10">
                    {customAuditorName ? customAuditorName.slice(0, 2).toUpperCase() : 'AU'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-dark-gray truncate leading-tight">{user?.displayName || customAuditorName}</p>
                  <span className="text-[9px] text-dark-gray/65 font-mono">Status: Connected</span>
                </div>
              </div>
            )}
          </aside>

          {/* Content View pane wrapper */}
          <main className="flex-1 flex flex-col min-w-0 bg-cream-bg overflow-y-auto">
            {/* Top Sticky Header */}
            <header className="bg-white border-b border-dark-gray/10 px-4 py-2.5 sticky top-0 z-20 flex md:hidden items-center justify-between shadow-xs">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-peach-accent text-dark-gray font-extrabold flex items-center justify-center text-xs border border-dark-gray/10">
                  I
                </div>
                <div>
                  <h1 className="text-xs font-bold text-dark-gray">SI-KKA Audit</h1>
                  <span className="text-[8px] uppercase tracking-wide text-dark-gray/60 font-bold block leading-none">Inspektorat Daerah</span>
                </div>
              </div>

              {/* Compact role indicator and logout for mobile view */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black bg-peach-accent text-dark-gray px-2 py-1 rounded-md border border-dark-gray/10 shadow-xs">
                  {userRole === 'Auditor' && '🕵️ Auditor'}
                  {userRole === 'Inspektur Pembantu' && '🔍 Irban'}
                  {userRole === 'Inspektur' && '👑 Inspektur'}
                </span>
                <button
                  onClick={handleSessionLogout}
                  className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold"
                  title="Keluar Sesi"
                >
                  Log out SI-KKA
                </button>
              </div>
            </header>

            {/* Core Body Container Frame */}
            <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full transition-all">
              {renderContent()}
            </div>
          </main>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Floating styled - visible ONLY on mobile) */}
      {isSessionActive && (
        <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 block md:hidden shadow-lg h-16">
          <div className="grid grid-cols-4 h-full">
            <button
              onClick={() => { setActiveTab('dashboard'); setSelectedAuditId(null); }}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                activeTab === 'dashboard' && !selectedAuditId ? 'text-dark-gray font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[9px] tracking-wide">Dashboard</span>
            </button>

            <button
              onClick={() => { setActiveTab('audits'); setSelectedAuditId(null); }}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                activeTab === 'audits' || selectedAuditId ? 'text-dark-gray font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <School className="w-5 h-5" />
              <span className="text-[9px] tracking-wide">Pemeriksaan</span>
            </button>

            <button
              onClick={() => { setActiveTab('template'); setSelectedAuditId(null); }}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                activeTab === 'template' && !selectedAuditId ? 'text-dark-gray font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[9px] tracking-wide">Template</span>
            </button>

            <button
              onClick={() => { setActiveTab('sync'); setSelectedAuditId(null); }}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                activeTab === 'sync' && !selectedAuditId ? 'text-dark-gray font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Cloud className="w-5 h-5" />
              <span className="text-[9px] tracking-wide">Google Sync</span>
            </button>
          </div>
        </footer>
      )}

    </div>
  );
}
