/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onEmailSignIn: (email: string, pass: string) => void;
  isSyncing: boolean;
}

export default function LoginView({ 
  onEmailSignIn, 
  isSyncing
}: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setValidationError('Email dan password wajib diisi.');
      return;
    }
    setValidationError('');
    onEmailSignIn(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FEFDF8 0%, #E8F0F8 30%, #F0F4F8 60%, #FEF9F0 100%)" }}>
      {/* Abstract background shapes */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-pastel-blue/25 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-pastel-peach/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-pastel-lavender/20 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[15%] w-[250px] h-[250px] bg-pastel-mint/20 rounded-full blur-[50px] pointer-events-none" />
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pastel-pink/15 rounded-full blur-[70px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl border border-pastel-blue/20 shadow-2xl overflow-hidden relative z-10 transition-all">
        
        {/* Top Header Panel */}
        <div className="p-6 md:p-8 text-[var(--ink-soft)] relative" style={{ background: "linear-gradient(135deg, #E8F0F8 0%, #FEF9F0 100%)" }}>
          <div className="absolute right-4 top-4 bg-pastel-peach/40 border border-pastel-peach/30 text-[var(--ink-soft)] px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
            Inspektorat Kab. Sumba Barat
          </div>
          
          <div className="flex items-center gap-3.5 mt-2">
            <div className="w-12 h-12 rounded-2xl bg-pastel-peach/60 text-[var(--ink-soft)] flex items-center justify-center font-black text-xl border border-pastel-peach/40 shadow-md transform rotate-3">
              SI
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--ink-soft)]">SI-PESAT</h1>
              <p className="text-xs uppercase tracking-widest text-[var(--text-secondary)] font-bold block mt-0.5">Sistem Informasi Penatausahaan Kertas Kerja Audit Terintegrasi</p>
            </div>
          </div>
        </div>

        {/* Input fields and authentication routes */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
          
          <div className="space-y-4">
            <label className="text-xs font-black text-[var(--ink-soft)] uppercase block tracking-wider">
              Autentikasi Pengguna
            </label>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  placeholder="Email akun (contoh: auditor@test.com)"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full text-xs font-bold border border-pastel-blue/20 pl-10 pr-4 p-3 rounded-xl bg-pastel-cream/30 text-[var(--ink-soft)] outline-none focus:bg-white focus:ring-2 focus:ring-pastel-peach/30 focus:border-pastel-peach placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Kata sandi..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full text-xs font-sans font-bold border border-pastel-blue/20 pl-10 pr-10 p-3 rounded-xl bg-pastel-cream/30 text-[var(--ink-soft)] outline-none focus:bg-white focus:ring-2 focus:ring-pastel-peach/30 focus:border-pastel-peach placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--ink-soft)] p-1"
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
            <button
              type="submit"
              disabled={isSyncing}
              className="w-full bg-dark-gray hover:bg-dark-gray/90 text-white py-4 px-4 rounded-xl flex items-center justify-center gap-2.5 transition font-extrabold text-xs shadow-md cursor-pointer disabled:opacity-75"
            >
              {isSyncing ? (
                <span className="animate-spin inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-pastel-peach" />
              )}
              <span>Masuk</span>
            </button>
          </div>
        </form>

        {/* Footer credentials brandings */}
        <div className="bg-pastel-cream/40 p-4 border-t border-pastel-blue/20 text-center flex items-center justify-between px-6">
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] font-bold">
            <ShieldCheck className="w-4 h-4 text-pastel-green" />
            <span>Sistem Audit Inspektorat</span>
          </div>
          <span className="text-[9px] font-mono font-medium text-[var(--text-muted)]">v1.6.0</span>
        </div>

      </div>
    </div>
  );
}
