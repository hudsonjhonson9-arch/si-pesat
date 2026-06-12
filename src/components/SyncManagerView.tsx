/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SyncLog, OpdAudit } from '../types';
import { User } from 'firebase/auth';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle, 
  AlertOctagon, 
  FolderSync, 
  FileCheck, 
  LogOut, 
  ListOrdered,
  BookOpen,
  ArrowDownToLine,
  ArrowUpToLine,
  Database
} from 'lucide-react';

interface SyncManagerViewProps {
  user: User | null;
  accessToken: string | null;
  logs: SyncLog[];
  audits: OpdAudit[];
  onLogin: () => void;
  onLogout: () => void;
  onBatchSyncToDrive: () => void;
  onFetchFromDrive: () => void;
  isSyncing: boolean;
  onClearLogs: () => void;
}

export default function SyncManagerView({
  user,
  accessToken,
  logs,
  audits,
  onLogin,
  onLogout,
  onBatchSyncToDrive,
  onFetchFromDrive,
  isSyncing,
  onClearLogs
}: SyncManagerViewProps) {
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <div className="space-y-6 text-dark-gray" id="sync-manager-view">
      {/* Account Profile Block */}
      <div className="bg-baby-blue rounded-xl border border-dark-gray/10 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {user ? (
          <div className="flex items-center gap-3.5 self-start md:self-auto min-w-0">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'Auditor Profile'} 
                className="w-12 h-12 rounded-full border-2 border-dark-gray/10 shadow-inner flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/40 text-dark-gray flex items-center justify-center font-bold text-lg font-mono uppercase flex-shrink-0 border-2 border-dark-gray/20">
                {user.displayName?.substring(0, 2) || 'AU'}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[10px] bg-white/40 text-dark-gray font-extrabold px-2 py-0.5 rounded border border-dark-gray/10 uppercase inline-block">
                Sesi Auditor Aktif
              </span>
              <h3 className="font-extrabold text-dark-gray text-sm mt-1 truncate">{user.displayName}</h3>
              <p className="text-xs text-dark-gray/70 truncate font-semibold">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="w-11 h-11 rounded-xl bg-white/40 text-dark-gray flex items-center justify-center flex-shrink-0 border border-dark-gray/10">
              <CloudOff className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] bg-white/40 text-dark-gray font-extrabold px-2 py-0.5 rounded border border-dark-gray/10 uppercase inline-block">
                Mode Offline / Draft Lokal
              </span>
              <h3 className="font-extrabold text-dark-gray text-sm mt-0.5">Google Drive Belum Terhubung</h3>
              <p className="text-xs text-dark-gray/70 font-semibold">Masuk dengan Akun Google untuk mengaktifkan real-time sync.</p>
            </div>
          </div>
        )}

        {user ? (
          <button
            onClick={() => {
              const confirmed = window.confirm('Apakah Anda ingin keluar dari sesi pemeriksaan Google Drive? Data lokal Anda akan tetap aman.');
              if (confirmed) onLogout();
            }}
            className="w-full md:w-auto bg-white hover:bg-white/80 border border-dark-gray/15 text-dark-gray text-xs font-extrabold px-3.5 py-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Keluar Akun
          </button>
        ) : (
          <button
            onClick={onLogin}
            className="w-full md:w-auto bg-peach-accent text-dark-gray border border-dark-gray/10 text-xs font-black px-5 py-2.5 rounded-lg inline-flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition cursor-pointer"
          >
            <Cloud className="w-4 h-4" /> Hubungkan Ke Drive
          </button>
        )}
      </div>

      {user && accessToken && (
        <>
          {/* Cloud Database Tool Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="drive-tools-grid">
            
            {/* Box 1: Backup / Push */}
            <div className="bg-baby-blue rounded-xl p-5 border border-dark-gray/10 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <span className="w-8 h-8 rounded-lg bg-white/40 text-dark-gray flex items-center justify-center mb-3 border border-dark-gray/5">
                  <ArrowUpToLine className="w-4 h-4" />
                </span>
                <h4 className="font-extrabold text-dark-gray text-sm">Cadangkan Massal Ke Cloud</h4>
                <p className="text-xs text-dark-gray/80 mt-1 font-semibold leading-relaxed">
                  Kirim seluruh kertas kerja KKA OPD ({audits.length} berkas) ke Google Drive. Aplikasi akan membuat folder secara otomatis di Drive Anda.
                </p>
              </div>
              <button
                onClick={onBatchSyncToDrive}
                disabled={isSyncing}
                className="w-full bg-peach-accent border border-dark-gray/10 text-dark-gray text-xs font-black py-2 rounded-lg inline-flex items-center justify-center gap-1.5 hover:opacity-90 transition cursor-pointer"
              >
                <FolderSync className="w-4 h-4" /> {isSyncing ? 'Mengunggah Berkas...' : 'Unggah Semua KKA'}
              </button>
            </div>

            {/* Box 2: Pull / Restore */}
            <div className="bg-baby-blue rounded-xl p-5 border border-dark-gray/10 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <span className="w-8 h-8 rounded-lg bg-white/40 text-dark-gray flex items-center justify-center mb-3 border border-dark-gray/5">
                  <ArrowDownToLine className="w-4 h-4" />
                </span>
                <h4 className="font-extrabold text-dark-gray text-sm">Ambil Berkas Dari Cloud</h4>
                <p className="text-xs text-dark-gray/80 mt-1 font-semibold leading-relaxed">
                  Sinkronisasikan kembali laporan-laporan KKA yang tersimpan di Google Drive ke dalam dashboard lokal Anda untuk real-time audit.
                </p>
              </div>
              <button
                onClick={onFetchFromDrive}
                disabled={isSyncing}
                className="w-full bg-dark-gray hover:bg-dark-gray/90 text-white text-xs font-extrabold py-2 rounded-lg inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Database className="w-4 h-4" /> {isSyncing ? 'Sinkronisasi Data...' : 'Panggil Semua Dari Drive'}
              </button>
            </div>

          </div>

          {/* Sync activity stream logs */}
          <div className="bg-baby-blue rounded-xl border border-dark-gray/10 p-5 shadow-xs" id="log-monitor text-dark-gray">
            <div className="flex items-center justify-between pb-3 border-b border-dark-gray/10 mb-4">
              <div>
                <h4 className="font-extrabold text-dark-gray text-sm">Monitor Log Sinkronisasi Real-Time</h4>
                <p className="text-xs text-dark-gray/70 font-semibold">Arus aktivitas unggah/unduh API Google Drive v3.</p>
              </div>
              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={onClearLogs}
                  className="text-xs font-black text-rose-700 hover:text-rose-900 cursor-pointer"
                >
                  Bersihkan Log
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-10 select-none bg-white/20 rounded-lg border border-dashed border-dark-gray/15">
                <FileCheck className="w-10 h-10 text-dark-gray/20 mx-auto mb-2" />
                <span className="text-xs text-dark-gray/60 font-semibold">Belum ada aktivitas sinkronisasi di sesi ini.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {logs.map((log) => {
                  const isError = log.type === 'ERROR';
                  const isFolder = log.type === 'CREATE_FOLDER';
                  return (
                    <div 
                      key={log.id} 
                      className={`text-xs p-2.5 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-2 ${
                        isError 
                          ? 'bg-rose-150/40 border border-rose-200 text-rose-950 font-semibold' 
                          : isFolder 
                            ? 'bg-amber-100/40 border border-amber-200 text-amber-950 font-semibold' 
                            : 'bg-white/45 border border-dark-gray/10 text-dark-gray'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 mt-0.5">
                          {isError ? (
                            <AlertOctagon className="w-4 h-4 text-rose-700 font-extrabold" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-800 font-extrabold" />
                          )}
                        </span>
                        <div>
                          <span className="font-black uppercase tracking-wider text-[9px] block">
                            {log.type}
                          </span>
                          <p className="font-bold leading-relaxed mt-0.5">{log.description}</p>
                          {log.opdName && (
                            <span className="text-[10px] text-dark-gray/60 block font-semibold mt-0.5">
                              Entitas: {log.opdName}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-dark-gray/60 font-mono flex-shrink-0 self-end md:self-auto font-bold">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
