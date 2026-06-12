/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  ShieldCheck, 
  Cloud, 
  Info,
  BookOpen,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (name: string, role: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur') => void;
  onGoogleSignIn: (role: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur') => void;
  userRole: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur';
  setUserRole: (role: 'Auditor' | 'Inspektur Pembantu' | 'Inspektur') => void;
  isSyncing: boolean;
}

export default function LoginView({ 
  onLoginSuccess, 
  onGoogleSignIn, 
  userRole, 
  setUserRole,
  isSyncing
}: LoginViewProps) {
  const [auditorName, setAuditorName] = useState(() => localStorage.getItem('si_kka_typed_name') || '');
  const [nipNumber, setNipNumber] = useState(() => localStorage.getItem('si_kka_typed_nip') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('si_kka_typed_password') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateForm = (): boolean => {
    if (!auditorName.trim()) {
      setValidationError('Nama Lengkap Pemeriksa wajib diisi.');
      return false;
    }
    if (!nipNumber.trim()) {
      setValidationError('NIP / Nomor Identitas Pegawai wajib diisi.');
      return false;
    }
    // Simple length check for NIP
    const cleanNip = nipNumber.trim().replace(/\s/g, '');
    if (cleanNip.length < 9) {
      setValidationError('NIP tidak valid. Minimal berisi 9 digit angka.');
      return false;
    }
    if (!password) {
      setValidationError('Kata sandi keamanan wajib diisi.');
      return false;
    }
    if (password.length < 6) {
      setValidationError('Kata sandi terlalu pendek. Minimal berisi 6 karakter.');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalName = auditorName.trim();
    localStorage.setItem('si_kka_typed_name', finalName);
    localStorage.setItem('si_kka_typed_nip', nipNumber.trim());
    localStorage.setItem('si_kka_typed_password', password);
    onLoginSuccess(finalName, userRole);
  };

  const handleGoogleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalName = auditorName.trim();
    localStorage.setItem('si_kka_typed_name', finalName);
    localStorage.setItem('si_kka_typed_nip', nipNumber.trim());
    localStorage.setItem('si_kka_typed_password', password);
    onGoogleSignIn(userRole);
  };

  return (
    <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4 selection:bg-peach-accent selection:text-dark-gray" id="login-gateway-page">
      {/* Absolute Ambient Background Accents like My Creative Workspace */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-baby-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-peach-accent/15 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-lg bg-white rounded-3xl border border-dark-gray/10 shadow-2xl overflow-hidden relative z-10 transition-all">
        
        {/* Top Header Panel - Styled like the pastel blue layout pattern */}
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
              <p className="font-extrabold text-dark-gray">Gerbang Autentikasi Pengawasan</p>
              <p className="text-dark-gray/70 leading-relaxed text-[11px]">
                Sistem tertutup yang digunakan khusus oleh Inspektorat Daerah dalam menyusun dan mereview Kertas Kerja Audit (KKA). Silakan masukkan identitas NIP dan kata sandi di bawah ini.
              </p>
            </div>
          </div>
        </div>

        {/* Input fields and authentication routes */}
        <form onSubmit={handleLocalSubmit} className="p-6 md:p-8 space-y-4">
          
          {/* STEP 1: Select internal role */}
          <div className="space-y-2">
            <label className="text-xs font-black text-dark-gray/85 uppercase block tracking-wider">
              1. Pilih Peran Pemeriksaan Anda
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'Auditor', emoji: '🕵️', title: 'Auditor', desc: 'Penyusun KKA' },
                { id: 'Inspektur Pembantu', emoji: '🔍', title: 'Irban', desc: 'Reviewer' },
                { id: 'Inspektur', emoji: '👑', title: 'Inspektur', desc: 'Pimpinan' }
              ].map((role) => {
                const isSelected = userRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setUserRole(role.id as any)}
                    type="button"
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-peach-accent border-dark-gray/30 text-dark-gray font-black shadow-md scale-[1.02]'
                        : 'bg-cream-bg/40 border-dark-gray/10 text-dark-gray/70 hover:bg-white hover:border-dark-gray/20'
                    }`}
                  >
                    <span className="text-xl select-none">{role.emoji}</span>
                    <span className="text-xs font-bold leading-none">{role.title}</span>
                    <span className="text-[9px] text-dark-gray/50 leading-none mt-0.5 font-medium">{role.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-dark-gray/10 my-1 pt-3 space-y-4">
            <label className="text-xs font-black text-dark-gray/85 uppercase block tracking-wider">
              2. Formulir Kredensial Pengawas
            </label>

            {/* Nama Pemeriksa */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-dark-gray/80">Nama Lengkap Pemeriksa</span>
                <span className="text-[9px] text-rose-500 font-bold font-mono">Wajib</span>
              </div>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-gray/40" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap beserta gelar..."
                  value={auditorName}
                  onChange={(e) => {
                    setAuditorName(e.target.value);
                    if (validationError && e.target.value.trim()) setValidationError('');
                  }}
                  className="w-full text-xs font-bold border border-dark-gray/15 pl-10 pr-4 p-3 rounded-xl bg-cream-bg/30 text-dark-gray outline-none focus:bg-white focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent placeholder:text-dark-gray/35"
                />
              </div>
            </div>

            {/* NIP */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-dark-gray/80">NIP (Nomor Identitas Pegawai)</span>
                <span className="text-[9px] text-rose-500 font-bold font-mono">Wajib</span>
              </div>
              <div className="relative">
                <span className="text-xs font-mono font-bold absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-gray/40 select-none">ID</span>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 19851024 201012 1 002"
                  value={nipNumber}
                  onChange={(e) => {
                    setNipNumber(e.target.value);
                    if (validationError && e.target.value.trim()) setValidationError('');
                  }}
                  className="w-full text-xs font-mono font-bold border border-dark-gray/15 pl-10 pr-4 p-3 rounded-xl bg-cream-bg/30 text-dark-gray outline-none focus:bg-white focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent placeholder:text-dark-gray/35"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-dark-gray/80">Kata Sandi / Password</span>
                <span className="text-[9px] text-rose-500 font-bold font-mono">Wajib</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-gray/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi (min. 6 karakter)..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationError && e.target.value) setValidationError('');
                  }}
                  className="w-full text-xs font-sans font-bold border border-dark-gray/15 pl-10 pr-10 p-3 rounded-xl bg-cream-bg/30 text-dark-gray outline-none focus:bg-white focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent placeholder:text-dark-gray/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-gray/40 hover:text-dark-gray/70 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="bg-rose-50 border border-rose-250 p-3.5 rounded-xl flex gap-2.5 items-start text-xs text-rose-800 animate-pulse">
              <AlertCircle className="w-4.5 h-4.5 text-rose-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Kesalahan Input</p>
                <p className="mt-0.5">{validationError}</p>
              </div>
            </div>
          )}

          {/* Core Authenticated Buttons */}
          <div className="space-y-3 pt-2">
            
            {/* GOOGLE DRIVE SYNC ENTRY (PRIMARY ROUTE) */}
            <button
              type="button"
              onClick={handleGoogleSubmit}
              disabled={isSyncing}
              className="w-full bg-dark-gray hover:bg-dark-gray/95 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition font-extrabold text-xs shadow-md border border-dark-gray/5 cursor-pointer disabled:opacity-75"
            >
              {isSyncing ? (
                <span className="animate-spin inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Cloud className="w-4 h-4 text-peach-accent" />
              )}
              <span>Koneksikan Google Drive & Masuk Sesi</span>
            </button>

            {/* SECONDARY LOCAL OFFLINE MODE ROUTE */}
            <button
              type="submit"
              className="w-full bg-peach-accent/80 hover:bg-peach-accent text-dark-gray font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-dark-gray/10 transition shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-dark-gray/60" />
              <span>Masuk Sesi Mode Lokal (Offline)</span>
            </button>
            
            <div className="text-center pt-1.5">
              <span className="text-[10px] text-dark-gray/55 font-bold block">
                ✓ Menggunakan enkripsi kredensial pemeriksaan berbasis perangkat daerah.
              </span>
            </div>
          </div>

        </form>

        {/* Footer credentials brandings */}
        <div className="bg-cream-bg/40 p-4 border-t border-dark-gray/10 text-center flex items-center justify-between px-6">
          <div className="flex items-center gap-1 text-[10px] text-dark-gray/50 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>Badan Pengawasan Juknis Kemendikbud</span>
          </div>
          <span className="text-[9px] font-mono font-medium text-dark-gray/40">SI-KKA Audit v1.4.0</span>
        </div>

      </div>
    </div>
  );
}
