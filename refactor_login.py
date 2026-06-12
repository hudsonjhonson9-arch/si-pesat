import os

filepath_login = 'src/components/LoginView.tsx'

new_login_content = """/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Cloud, Info } from 'lucide-react';

interface LoginViewProps {
  onGoogleSignIn: () => void;
  isSyncing: boolean;
}

export default function LoginView({ 
  onGoogleSignIn, 
  isSyncing
}: LoginViewProps) {

  const handleGoogleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    onGoogleSignIn();
  };

  return (
    <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4 selection:bg-peach-accent selection:text-dark-gray" id="login-gateway-page">
      {/* Absolute Ambient Background Accents like My Creative Workspace */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-baby-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-peach-accent/15 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md bg-white rounded-3xl border border-dark-gray/10 shadow-2xl overflow-hidden relative z-10 transition-all">
        
        {/* Top Header Panel */}
        <div className="bg-baby-blue p-6 md:p-8 text-dark-gray relative border-b border-dark-gray/10">
          <div className="absolute right-4 top-4 bg-peach-accent/80 border border-dark-gray/10 text-dark-gray px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
            Inspektorat Pengawas Daerah
          </div>
          
          <div className="flex items-center gap-3.5 mt-2">
            <div className="w-12 h-12 rounded-2xl bg-peach-accent text-dark-gray flex items-center justify-center font-black text-xl border border-dark-gray/20 shadow-md transform rotate-3">
              SI
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-dark-gray">SI-KKA Audit</h1>
              <p className="text-xs uppercase tracking-widest text-dark-gray/70 font-bold block mt-0.5">Kertas Kerja Audit Daerah</p>
            </div>
          </div>
        </div>

        {/* Info card box regarding integration and juknis */}
        <div className="px-6 pt-6 animate-fade-in" id="welcome-alert">
          <div className="bg-cream-bg border border-peach-accent/50 rounded-2xl p-4 flex gap-3 text-xs text-dark-gray/90">
            <Info className="w-5 h-5 text-dark-gray/70 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-dark-gray">Autentikasi Terpusat</p>
              <p className="text-dark-gray/70 leading-relaxed text-[11px]">
                Sistem menggunakan autentikasi SSO (Single Sign-On). Silakan masuk menggunakan akun instansi Anda. Data KKA akan tersinkronisasi dan tersimpan secara offline di perangkat Anda setelah login.
              </p>
            </div>
          </div>
        </div>

        {/* Input fields and authentication routes */}
        <div className="p-6 md:p-8">
          {/* Core Authenticated Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSubmit}
              disabled={isSyncing}
              className="w-full bg-dark-gray hover:bg-dark-gray/95 text-white py-4 px-4 rounded-xl flex items-center justify-center gap-2.5 transition font-extrabold text-xs shadow-md border border-dark-gray/5 cursor-pointer disabled:opacity-75"
            >
              {isSyncing ? (
                <span className="animate-spin inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Cloud className="w-4 h-4 text-peach-accent" />
              )}
              <span>Masuk dengan Akses SSO Instansi</span>
            </button>
            
            <div className="text-center pt-2">
              <span className="text-[10px] text-dark-gray/55 font-bold block">
                ✓ Enkripsi basis data tersinkronisasi secara real-time.
              </span>
            </div>
          </div>
        </div>

        {/* Footer credentials brandings */}
        <div className="bg-cream-bg/40 p-4 border-t border-dark-gray/10 text-center flex items-center justify-between px-6">
          <div className="flex items-center gap-1 text-[10px] text-dark-gray/50 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>Sistem Audit Inspektorat</span>
          </div>
          <span className="text-[9px] font-mono font-medium text-dark-gray/40">v1.5.0</span>
        </div>

      </div>
    </div>
  );
}
"""

with open(filepath_login, 'w', encoding='utf-8') as f:
    f.write(new_login_content)

# Update App.tsx
filepath_app = 'src/App.tsx'
with open(filepath_app, 'r', encoding='utf-8') as f:
    app_content = f.read()

# 1. Update handleGoogleSignInWithRole
old_handler = """  const handleGoogleSignInWithRole = async (role: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur') => {
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
  };"""

new_handler = """  const handleGoogleSignIn = async () => {
    try {
      // Initiate Supabase OAuth
      await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      // Page will redirect to Google
    } catch (err: any) {
      showToast(`Login gagal: ${err.message}`, 'error');
    }
  };"""
app_content = app_content.replace(old_handler, new_handler)

# 2. Update alias
app_content = app_content.replace("const handleLogin = handleGoogleSignInWithRole; // Alias", "const handleLogin = handleGoogleSignIn; // Alias")

# 3. Update LoginView invocation
old_login_invocation = """      {!isSessionActive ? (
        <LoginView
          onLoginSuccess={handleSessionLogin}
          onGoogleSignIn={handleGoogleSignInWithRole}
          userRole={userRole}
          setUserRole={setUserRole}
          isSyncing={isSyncing}
        />
      ) : ("""

new_login_invocation = """      {!isSessionActive ? (
        <LoginView
          onGoogleSignIn={handleGoogleSignIn}
          isSyncing={isSyncing}
        />
      ) : ("""
app_content = app_content.replace(old_login_invocation, new_login_invocation)

with open(filepath_app, 'w', encoding='utf-8') as f:
    f.write(app_content)

print("Refactored LoginView and App.tsx to remove offline mode")
