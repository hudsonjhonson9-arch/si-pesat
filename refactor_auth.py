import os

filepath = 'src/App.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { initAuth, googleSignIn, logout, getAccessToken } from './lib/firebase';\nimport { syncAuditToDrive, fetchAuditsFromDrive, deleteAuditFromDrive } from './lib/googleDrive';\nimport { User } from 'firebase/auth';",
    "import { supabase } from './lib/supabase';\nimport { Session, User } from '@supabase/supabase-js';"
)

# 2. State
content = content.replace(
    "const [user, setUser] = useState<User | null>(null);\n  const [accessToken, setAccessToken] = useState<string | null>(null);",
    "const [user, setUser] = useState<User | null>(null);\n  const [session, setSession] = useState<Session | null>(null);"
)

# 3. UseEffect Auth
old_effect = """  // 3. Setup Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsSessionActive(true);
        localStorage.setItem('si_kka_session_active', 'true');
        if (currentUser.displayName) {
          setCustomAuditorName(currentUser.displayName);
          localStorage.setItem('si_kka_custom_name', currentUser.displayName);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, [showToast]);"""

new_effect = """  // 3. Setup Supabase Auth state listener
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
  }, []);"""

content = content.replace(old_effect, new_effect)

# 4. Auth Handlers
old_handlers = """  // Login handler
  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setIsSessionActive(true);
        localStorage.setItem('si_kka_session_active', 'true');
        const name = result.user.displayName || 'Auditor Google';
        setCustomAuditorName(name);
        localStorage.setItem('si_kka_custom_name', name);
        showToast(`Berhasil masuk sebagai ${name}`, 'success');
        addSyncLog('UPLOAD', `Koneksi Google Drive diaktifkan oleh ${result.user.email}`);
      }
    } catch (err: any) {
      showToast(`Login gagal: ${err.message}`, 'error');
      addSyncLog('ERROR', `Koneksi Gagal: ${err.message}`);
    }
  };

  const handleGoogleSignInWithRole = async (role: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur') => {
    try {
      setUserRole(role);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setIsSessionActive(true);
        localStorage.setItem('si_kka_session_active', 'true');
        localStorage.setItem('si_kka_user_role', role);
        const name = result.user.displayName || 'Auditor Google';
        setCustomAuditorName(name);
        localStorage.setItem('si_kka_custom_name', name);
        showToast(`Berhasil masuk sebagai ${name} (${role})`, 'success');
        addSyncLog('UPLOAD', `Koneksi Google Drive diaktifkan oleh ${result.user.email}`);
      }
    } catch (err: any) {
      showToast(`Login gagal: ${err.message}`, 'error');
      addSyncLog('ERROR', `Koneksi Gagal: ${err.message}`);
    }
  };

  const handleSessionLogin = (name: string, role: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur') => {
    setCustomAuditorName(name);
    setUserRole(role);
    setIsSessionActive(true);
    localStorage.setItem('si_kka_session_active', 'true');
    localStorage.setItem('si_kka_custom_name', name);
    localStorage.setItem('si_kka_user_role', role);
    showToast(`Berhasil masuk sebagai ${name} (${role})`, 'success');
  };

  const handleSessionLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setIsSessionActive(false);
    localStorage.removeItem('si_kka_session_active');
    localStorage.removeItem('si_kka_custom_name');
    showToast('Telah keluar dari sesi KKA SI-KKA Audit.', 'info');
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setIsSessionActive(false);
    localStorage.removeItem('si_kka_session_active');
    localStorage.removeItem('si_kka_custom_name');
    showToast('Telah keluar dari sesi pemeriksaan Cloud.', 'info');
    addSyncLog('DOWNLOAD', 'Sesi pemeriksaan Cloud diputus.');
  };"""

new_handlers = """  // Login handlers via Supabase
  const handleGoogleSignInWithRole = async (role: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur') => {
    try {
      setUserRole(role);
      localStorage.setItem('si_kka_user_role', role);
      // Initiate Supabase OAuth
      await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      // Page will redirect to Google
    } catch (err: any) {
      showToast(`Login gagal: ${err.message}`, 'error');
      addSyncLog('ERROR', `Koneksi Gagal: ${err.message}`);
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

  const handleLogin = handleGoogleSignInWithRole; // Alias
  const handleLogout = handleSessionLogout;"""

content = content.replace(old_handlers, new_handlers)

# Fix accessToken -> session.provider_token or remove it.
# We will replace `isDriveConnected={!!accessToken}` with `isDriveConnected={true}` since we use GAS.
# And `accessToken={accessToken}` is no longer needed but we can pass `""` to avoid type errors for now.
content = content.replace("isDriveConnected={!!accessToken}", "isDriveConnected={true}")
content = content.replace("accessToken={accessToken}", "accessToken={''}")
content = content.replace("syncSingleToDrive(updatedAudit, true)", "addSyncLog('UPLOAD', 'Pembaruan disimpan lokal. Sync otomatis akan berjalan.')")
content = content.replace("syncSingleToDrive(aud)", "addSyncLog('UPLOAD', 'Pembaruan disimpan lokal.')")

# We will remove drive-related functions inside App.tsx like fetchAllFromDrive, batchSyncAllToDrive, etc. 
# We'll replace them with SyncToSupabase logic later. Let's just stub them for now.

content = content.replace("const batchSyncAllToDrive = async () => {", "const batchSyncAllToDrive = async () => { /* TO DO */")
content = content.replace("const fetchAllFromDrive = async () => {", "const fetchAllFromDrive = async () => { /* TO DO */")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Auth refactored in App.tsx")
