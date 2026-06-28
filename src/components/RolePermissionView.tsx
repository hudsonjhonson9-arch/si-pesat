import React, { useState, useEffect } from 'react';
import { Shield, Plus, Save, X } from 'lucide-react';
import { Role, Permission, RolePermission as RolePermType } from '../types';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/log';
import { permissionChecker } from '../lib/permissions';

interface RolePermissionViewProps {
  rolesList: Role[];
  permissionsList: Permission[];
  bidangList: { id: number; name: string }[];
  onShowToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

export default function RolePermissionView({ rolesList, permissionsList, bidangList, onShowToast }: RolePermissionViewProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [localPerms, setLocalPerms] = useState<Record<string, { enabled: boolean; scope: 'bidang' | 'all' }>>({});
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedRoleId) return;
    const loadPerms = async () => {
      const { data } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', selectedRoleId);

      const permMap: Record<string, { enabled: boolean; scope: 'bidang' | 'all' }> = {};
      permissionsList.forEach(p => {
        const rp = data?.find((r: any) => r.permission_id === p.id);
        permMap[p.code] = {
          enabled: !!rp,
          scope: rp?.scope || 'bidang',
        };
      });
      setLocalPerms(permMap);
    };
    loadPerms();
  }, [selectedRoleId, permissionsList]);

  const handleToggle = (code: string) => {
    setLocalPerms(prev => ({
      ...prev,
      [code]: { ...prev[code], enabled: !prev[code].enabled },
    }));
  };

  const handleScopeChange = (code: string, scope: 'bidang' | 'all') => {
    setLocalPerms(prev => ({
      ...prev,
      [code]: { ...prev[code], scope },
    }));
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    setIsSaving(true);
    try {
      await supabase.from('role_permissions').delete().eq('role_id', selectedRoleId);

      const inserts = (Object.entries(localPerms) as [string, { enabled: boolean; scope: 'bidang' | 'all' }][])
        .filter(([, v]) => v.enabled)
        .map(([code, v]) => {
          const perm = permissionsList.find(p => p.code === code);
          return perm ? { role_id: selectedRoleId, permission_id: perm.id, scope: v.scope } : null;
        })
        .filter(Boolean);

      if (inserts.length > 0) {
        const { error } = await supabase.from('role_permissions').insert(inserts);
        if (error) throw error;
      }

      const { data } = await supabase.from('role_permissions').select('*');
      if (data) permissionChecker.setRolePermissions(data as RolePermType[]);

      const roleName = rolesList.find(r => r.id === selectedRoleId)?.name || String(selectedRoleId);
      logActivity('update_role_permissions', 'role', roleName);
      onShowToast?.('Permission berhasil disimpan.', 'success');
    } catch (err: any) {
      onShowToast?.('Gagal menyimpan: ' + (err.message || err), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    const maxId = Math.max(...rolesList.map(r => r.id), 0);
    const { error } = await supabase.from('roles').insert({ id: maxId + 1, name: newRoleName.trim() });
    if (error) {
      onShowToast?.('Gagal menambah role: ' + error.message, 'error');
      return;
    }
    logActivity('create_role', 'role', newRoleName.trim());
    onShowToast?.('Role berhasil ditambahkan.', 'success');
    setShowAddRole(false);
    setNewRoleName('');
  };

  const selectedRole = rolesList.find(r => r.id === selectedRoleId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-dark-gray flex items-center gap-2">
            <Shield className="w-5 h-5 text-dark-gray/70" /> Role & Permission
          </h2>
          <p className="text-xs text-dark-gray/60 mt-1">Atur hak akses setiap role. Perubahan berlaku setelah login ulang.</p>
        </div>
        <button onClick={() => setShowAddRole(true)}
          className="inline-flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl bg-dark-gray text-white hover:bg-dark-gray/85 transition-all shadow-sm cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Tambah Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-2xl border border-dark-gray/10 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-dark-gray">Daftar Role</h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {rolesList.map(role => (
              <button key={role.id} onClick={() => setSelectedRoleId(role.id)}
                className={`w-full text-left px-4 py-3 transition-all cursor-pointer hover:bg-slate-50 ${
                  selectedRoleId === role.id ? 'bg-peach-accent/10 border-l-2 border-peach-accent' : ''
                }`}>
                <p className="text-xs font-bold text-dark-gray">{role.name}</p>
                <p className="text-[10px] text-dark-gray/50 mt-0.5">ID: {role.id}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-dark-gray/10 shadow-sm">
          {!selectedRole ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-400">Pilih role untuk mengatur permission</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-base text-dark-gray">{selectedRole.name}</h3>
                  <p className="text-[10px] text-dark-gray/60 mt-0.5">Atur permission dan scope untuk role ini</p>
                </div>
                <button onClick={handleSave} disabled={isSaving}
                  className="inline-flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl bg-dark-gray text-white hover:bg-dark-gray/85 transition-all shadow-sm cursor-pointer disabled:opacity-60">
                  {isSaving ? 'Menyimpan...' : <><Save className="w-3.5 h-3.5" /> Simpan Perubahan</>}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {permissionsList.map(perm => {
                  const permState = localPerms[perm.code];
                  if (!permState) return null;
                  return (
                    <div key={perm.id}
                      className={`p-4 rounded-xl border transition-all ${
                        permState.enabled
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-dark-gray">{perm.label}</p>
                          <p className="text-[9px] font-mono text-dark-gray/50 mt-0.5">{perm.code}</p>
                        </div>
                        <button type="button" onClick={() => handleToggle(perm.code)}
                          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer border-2 shrink-0 ml-2 ${
                            permState.enabled ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-300 border-slate-400'
                          }`}>
                          <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                            permState.enabled ? 'translate-x-[18px]' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                      {permState.enabled && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">Scope:</span>
                          <select value={permState.scope}
                            onChange={e => handleScopeChange(perm.code, e.target.value as 'bidang' | 'all')}
                            className="text-[10px] font-bold border border-slate-300 px-2 py-1 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400">
                            <option value="bidang">Bidang (halaman sendiri)</option>
                            <option value="all">Semua (lintas bidang)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddRole && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddRole(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-dark-gray">Tambah Role Baru</h3>
              <button onClick={() => setShowAddRole(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nama Role</label>
                <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                  placeholder="Contoh: Auditor Kontrak"
                  className="w-full text-sm font-bold border border-slate-200 p-2.5 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddRole(false)}
                  className="flex-1 text-xs py-2.5 rounded-lg font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                  Batal
                </button>
                <button onClick={handleAddRole} disabled={!newRoleName.trim()}
                  className="flex-1 text-xs py-2.5 rounded-lg font-bold bg-dark-gray text-white hover:bg-dark-gray/85 transition cursor-pointer disabled:opacity-60">
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
