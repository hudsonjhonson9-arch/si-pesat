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
    <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4 selection:bg-peach-accent selection:text-dark-gray" id="login-gateway-page">
      <div className="absolute top-10 left-10 w-64 h-64 bg-baby-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-peach-accent/15 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md bg-white rounded-3xl border border-dark-gray/10 shadow-2xl overflow-hidden relative z-10 transition-all">
        
        {/* Top Header Panel */}
        <div className="bg-baby-blue p-6 md:p-8 text-dark-gray relative border-b border-dark-gray/10">
          <div className="absolute right-4 top-4 bg-peach-accent/80 border border-dark-gray/10 text-dark-gray px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
            Inspektorat Kab. Sumba Barat
          </div>
          
          <div className="flex items-center gap-3.5 mt-2">
            <div className="w-12 h-12 rounded-2xl bg-peach-accent text-dark-gray flex items-center justify-center font-black text-xl border border-dark-gray/20 shadow-md transform rotate-3">
              SI
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-dark-gray">SI-PESAT Audit</h1>
              <p className="text-xs uppercase tracking-widest text-dark-gray/70 font-bold block mt-0.5">Kertas Kerja Audit Daerah</p>
            </div>
          </div>
        </div>

        {/* Input fields and authentication routes */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
          
          <div className="space-y-4">
            <label className="text-xs font-black text-dark-gray/85 uppercase block tracking-wider">
              Autentikasi Pengguna
            </label>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-gray/40" />
                <input
                  type="email"
                  required
                  placeholder="Email akun (contoh: auditor@test.com)"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  className="w-full text-xs font-bold border border-dark-gray/15 pl-10 pr-4 p-3 rounded-xl bg-cream-bg/30 text-dark-gray outline-none focus:bg-white focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent placeholder:text-dark-gray/35"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-gray/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Kata sandi..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationError) setValidationError('');
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
            <button
              type="submit"
              disabled={isSyncing}
              className="w-full bg-dark-gray hover:bg-dark-gray/95 text-white py-4 px-4 rounded-xl flex items-center justify-center gap-2.5 transition font-extrabold text-xs shadow-md border border-dark-gray/5 cursor-pointer disabled:opacity-75"
            >
              {isSyncing ? (
                <span className="animate-spin inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-peach-accent" />
              )}
              <span>Masuk Sesi</span>
            </button>
          </div>
        </form>

        {/* Footer credentials brandings */}
        <div className="bg-cream-bg/40 p-4 border-t border-dark-gray/10 text-center flex items-center justify-between px-6">
          <div className="flex items-center gap-1 text-[10px] text-dark-gray/50 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>Sistem Audit Inspektorat</span>
          </div>
          <span className="text-[9px] font-mono font-medium text-dark-gray/40">v1.6.0</span>
        </div>

      </div>
    </div>
  );
}
