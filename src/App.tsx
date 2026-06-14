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
  Info,
  PlusCircle
} from 'lucide-react';

import { OpdAudit, KKATemplate, SyncLog, AuditCategory, AuditItem, UserProfile, TargetEntity } from './types';
import { EMPTY_KKA_TEMPLATE } from './data';
import { supabase } from './lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Custom subcomponents
import HomeView from './components/HomeView';
import AuditListView from './components/AuditListView';
import AuditWorkspaceView from './components/AuditWorkspaceView';
import TemplateConfiguratorView from './components/TemplateConfiguratorView';
import LoginView from './components/LoginView';
import NewAuditView from './components/NewAuditView';

export default function App() {
  // Navigation & General Tabs based on URL Hash
  const [activeTab, setActiveTab] = useState<'dashboard' | 'audits' | 'jenis-audit' | 'new-audit'>('dashboard');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  // Router logic for hash changes (browser back/forward support)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('workspace/')) {
        const id = hash.split('/')[1];
        setActiveTab('audits');
        setSelectedAuditId(id);
      } else if (hash === 'jenis-audit' || hash === 'audits' || hash === 'dashboard' || hash === 'new-audit') {
        setActiveTab(hash as any);
        setSelectedAuditId(null);
      } else {
        setActiveTab('dashboard');
        setSelectedAuditId(null);
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

  // Core Applet States
  const [audits, setAudits] = useState<OpdAudit[]>([]);
  const [templates, setTemplates] = useState<KKATemplate[]>([EMPTY_KKA_TEMPLATE]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  // Simulated internal account role ('Auditor' | 'Inspektur Pembantu' | 'Inspektur')
  const [userRole, setUserRole] = useState<'Auditor' | 'Inspektur Pembantu' | 'Inspektur'>(() => {
    const cached = localStorage.getItem('si_pesat_user_role');
    return (cached as 'Auditor' | 'Inspektur Pembantu' | 'Inspektur') || 'Auditor';
  });

  // Session Login gate state
  const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
    return localStorage.getItem('si_pesat_session_active') === 'true';
  });
  const [customAuditorName, setCustomAuditorName] = useState<string>(() => {
    return localStorage.getItem('si_pesat_custom_name') || '';
  });

  // Authentication & Cloud Sync
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [targetEntities, setTargetEntities] = useState<TargetEntity[]>([]);

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
    if (navigator.onLine) {
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
            lastSyncedAt: d.updated_at || new Date().toISOString()
          }));
          
          setAudits(prevLocalAudits => {
            // Keep local audits that are NOT in DB but have NO lastSyncedAt (newly created offline)
            const offlineCreatedAudits = prevLocalAudits.filter(
              local => !mapped.find(m => m.id === local.id) && !local.lastSyncedAt
            );
            return [...mapped, ...offlineCreatedAudits];
          });
        }
      });

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
              audit_type: a.auditType,
              fiscal_year: a.fiscalYear,
              auditor_name: a.auditorName,
              audit_date: a.auditDate,
              status: a.status,
              progress: calculateProgress(a),
              categories: a.categories,
              team_members: a.teamMembers || [],
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
         localStorage.setItem('si_pesat_session_active', 'true');
         const name = session.user.user_metadata?.full_name || session.user.email || 'Auditor';
         setCustomAuditorName(name);
         
         supabase.from('profiles').select('id, email, full_name, role, nip, golongan, pangkat').then(({ data, error }) => {
           if (!error && data) setUserProfiles(data as UserProfile[]);
         });

         supabase.from('target_entities').select('*').order('type').then(({ data, error }) => {
           if (!error && data) setTargetEntities(data as TargetEntity[]);
         });

         supabase.from('profiles').select('role').eq('id', session.user.id).single()
           .then(({ data }) => {
              if (data?.role) {
                setUserRole(data.role as any);
                localStorage.setItem('si_pesat_user_role', data.role);
              }
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

  const handleSessionLogin = (name: string, role: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur') => {
    setCustomAuditorName(name);
    setUserRole(role);
    setIsSessionActive(true);
    localStorage.setItem('si_pesat_session_active', 'true');
    localStorage.setItem('si_pesat_custom_name', name);
    localStorage.setItem('si_pesat_user_role', role);
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


  // Calculate Progress Helper
  const calculateProgress = (audit: OpdAudit): number => {
    let totalItems = 0;
    let evaluatedItems = 0;
    audit.categories.forEach(cat => {
      cat.items.forEach(item => {
        totalItems++;
        // Asumsi: Jika ada uraian temuan, atau statusnya bukan Sesuai (karena default Sesuai), atau ada nilai temuan, berarti sudah dievaluasi.
        // Jika kita ingin lebih presisi, kita bisa tambahkan status 'Draft' di item, tapi untuk sekarang kita anggap dievaluasi jika ada perubahan
        if (item.status === 'Temuan' || item.status === 'N/A' || (item.uraianTemuan && item.uraianTemuan.length > 0) || (item.nilaiTemuan && item.nilaiTemuan > 0)) {
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
    _legacyAuditType: string, // Kept for backwards compatibility with AuditListView call signature
    fiscalYear: string, 
    auditorName: string,
    teamMembers: string[],
    templateId: string,
    initialCategoryId?: string
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
      auditType,
      fiscalYear,
      auditorName,
      auditDate: new Date().toISOString().split('T')[0],
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
          onBack={() => navigateTo('audits')}
          onUpdates={handleUpdateAudit}
          onSync={(aud) => addSyncLog('UPLOAD', 'Pembaruan disimpan lokal.')}
          isDriveConnected={true}
          isSyncing={isSyncing}
          userRole={userRole}
          userProfiles={userProfiles}
          currentUserName={userProfiles.find(p => p.id === user?.id)?.full_name || user?.user_metadata?.full_name || user?.email || ''}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <HomeView targetEntities={targetEntities} audits={audits} onSelectAudit={(aud) => navigateTo(`workspace/${aud.id}`)} userRole={userRole} />;
      case 'audits':
        return (
          <AuditListView
            audits={audits}
            templates={templates}
            targetEntities={targetEntities}
            onSelectAudit={(aud) => navigateTo(`workspace/${aud.id}`)}
            onCreateAudit={handleCreateAudit}
            onDeleteAudit={handleDeleteAudit}
            onSyncToDrive={(aud) => addSyncLog('UPLOAD', 'Pembaruan disimpan lokal.')}
            isDriveConnected={true}
            userRole={userRole}
            defaultAuditorName={userProfiles.find(p => p.id === user?.id)?.full_name || user?.user_metadata?.full_name || user?.email || customAuditorName || ''}
            userProfiles={userProfiles}
          />
        );
      case 'new-audit':
        return (
          <NewAuditView
            templates={templates}
            userProfiles={userProfiles}
            defaultAuditorName={userProfiles.find(p => p.id === user?.id)?.full_name || user?.user_metadata?.full_name || user?.email || ''}
            onBack={() => navigateTo('audits')}
            onCreateAudit={(opdName, opdType, legacy, fiscalYear, auditorName, teamMembers, templateId, catId) => {
              handleCreateAudit(opdName, opdType, legacy, fiscalYear, auditorName, teamMembers, templateId, catId);
              navigateTo('audits');
            }}
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
                <h1 className="font-extrabold text-sm md:text-base text-dark-gray tracking-tight">SI-PESAT Audit</h1>
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-dark-gray/70 font-bold block leading-none">Inspektorat Daerah</span>
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
                onClick={() => navigateTo('audits')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${
                  activeTab === 'audits' || selectedAuditId
                    ? 'bg-peach-accent text-dark-gray shadow-sm border border-dark-gray/5' 
                    : 'text-dark-gray/70 hover:bg-white/40 hover:text-dark-gray'
                }`}
              >
                <School className="w-4 h-4" /> Pemeriksaan
              </button>
              {['Inspektur', 'Inspektur Pembantu', 'Admin'].includes(userRole) && (
                <button
                  onClick={() => navigateTo('jenis-audit')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${
                    activeTab === 'jenis-audit' && !selectedAuditId
                      ? 'bg-peach-accent text-dark-gray shadow-sm border border-dark-gray/5' 
                      : 'text-dark-gray/70 hover:bg-white/40 hover:text-dark-gray'
                  }`}
                >
                  <Settings className="w-4 h-4" /> Jenis Audit
                </button>
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
              <PlusCircle className="w-4 h-4" /> Mulai Audit Baru
            </button>

            {/* Right Profile & Role */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] font-black bg-peach-accent text-dark-gray px-2 py-0.5 rounded-sm border border-dark-gray/10 shadow-xs uppercase tracking-wider mb-0.5">
                  {userRole === 'Auditor' && '🕵️ Auditor'}
                  {userRole === 'Inspektur Pembantu' && '🔍 Irban'}
                  {userRole === 'Inspektur' && '👑 Inspektur'}
                </span>
                <span className="text-xs font-bold text-dark-gray">{userProfiles.find(p => p.id === user?.id)?.full_name || user?.user_metadata?.full_name || user?.email || customAuditorName || 'Auditor'}</span>
              </div>
              
              {/* Mobile compact role */}
              <span className="md:hidden text-[10px] font-black bg-peach-accent text-dark-gray px-2 py-1 rounded-md border border-dark-gray/10 shadow-xs">
                {userRole === 'Auditor' && '🕵️ Auditor'}
                {userRole === 'Inspektur Pembantu' && '🔍 Irban'}
                {userRole === 'Inspektur' && '👑 Inspektur'}
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

      {/* Mobile Bottom Navigation Bar (Floating styled - visible ONLY on mobile) */}
      {isSessionActive && (
        <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 block md:hidden shadow-lg h-16">
          <div className={`grid h-full ${['Inspektur', 'Inspektur Pembantu', 'Admin'].includes(userRole) ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <button
              onClick={() => navigateTo('dashboard')}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                activeTab === 'dashboard' && !selectedAuditId ? 'text-dark-gray font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-[9px] tracking-wide">Beranda</span>
            </button>

            <button
              onClick={() => navigateTo('audits')}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                activeTab === 'audits' || selectedAuditId ? 'text-dark-gray font-bold' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <School className="w-5 h-5" />
              <span className="text-[9px] tracking-wide">Pemeriksaan</span>
            </button>

            {['Inspektur', 'Inspektur Pembantu', 'Admin'].includes(userRole) && (
              <button
                onClick={() => navigateTo('jenis-audit')}
                className={`flex flex-col items-center justify-center gap-1 transition ${
                  activeTab === 'jenis-audit' && !selectedAuditId ? 'text-dark-gray font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="text-[9px] tracking-wide">Jenis Audit</span>
              </button>
            )}
          </div>
        </footer>
      )}

    </div>
  );
}
