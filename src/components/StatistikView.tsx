/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { OpdAudit } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, CheckCircle, AlertTriangle, FileText, Activity } from 'lucide-react';

interface StatistikViewProps {
  audits: OpdAudit[];
  userRole?: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Draft': '#94a3b8',
  'Sedang Berjalan': '#3b82f6',
  'Direview': '#f59e0b',
  'Selesai': '#10b981',
};

const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', notation: 'compact', maximumFractionDigits: 1 }).format(val);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill || p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function StatistikView({ audits }: StatistikViewProps) {
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { 'Draft': 0, 'Sedang Berjalan': 0, 'Direview': 0, 'Selesai': 0 };
    audits.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [audits]);

  const opdTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    audits.forEach(a => { counts[a.opdType] = (counts[a.opdType] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [audits]);

  const temuanData = useMemo(() => {
    return audits
      .map(a => {
        let temuan = 0;
        a.categories.forEach(c => c.items.forEach(i => { if (i.status === 'Temuan') temuan++; }));
        const shortName = a.opdName.length > 22 ? a.opdName.substring(0, 20) + '\u2026' : a.opdName;
        return { name: shortName, temuan };
      })
      .filter(d => d.temuan > 0)
      .sort((a, b) => b.temuan - a.temuan)
      .slice(0, 10);
  }, [audits]);

  const yearData = useMemo(() => {
    const counts: Record<string, number> = {};
    audits.forEach(a => { counts[a.fiscalYear] = (counts[a.fiscalYear] || 0) + 1; });
    return Object.entries(counts)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([name, value]) => ({ name: `TA ${name}`, value }));
  }, [audits]);

  const totals = useMemo(() => {
    let temuan = 0, nilai = 0;
    audits.forEach(a => a.categories.forEach(c => c.items.forEach(i => {
      if (i.status === 'Temuan') { temuan++; nilai += i.nilaiTemuan || 0; }
    })));
    return { kka: audits.length, selesai: audits.filter(a => a.status === 'Selesai').length, temuan, nilai };
  }, [audits]);

  const completionPct = totals.kka > 0 ? Math.round((totals.selesai / totals.kka) * 100) : 0;

  const EmptyState = () => (
    <div className="h-48 flex flex-col items-center justify-center text-slate-300 gap-2">
      <Activity className="w-10 h-10" />
      <p className="text-xs font-bold italic">Belum ada data audit</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-dark-gray">Statistik & Grafik Audit</h2>
        <p className="text-xs text-dark-gray/60 mt-1">Ringkasan dan visualisasi data KKA Inspektorat Kabupaten Sumba Barat</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <FileText className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100', value: totals.kka, label: 'Total KKA', sub: `${totals.kka} pemeriksaan` },
          { icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-100', value: totals.selesai, label: 'KKA Selesai', sub: `${completionPct}% dari total` },
          { icon: <AlertTriangle className="w-5 h-5 text-rose-600" />, bg: 'bg-rose-100', value: totals.temuan, label: 'Total Temuan', sub: 'item bermasalah' },
          { icon: <TrendingUp className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-100', value: totals.nilai > 0 ? formatRupiah(totals.nilai) : 'Rp 0', label: 'Nilai Temuan', sub: 'akumulasi keuangan' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-dark-gray/10 shadow-sm">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>{card.icon}</div>
            <p className="text-2xl font-black text-slate-800 leading-none">{card.value}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{card.label}</p>
            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Global Progress */}
      {totals.kka > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-dark-gray/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700">Progres Penyelesaian Keseluruhan</span>
            <span className="text-xs font-black text-dark-gray font-mono">{completionPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-peach-accent to-emerald-400 transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 flex-wrap">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s.name] }} />
                <span className="text-[10px] font-semibold text-slate-500">{s.name}: <strong className="text-slate-700">{s.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-dark-gray/10 shadow-sm">
          <h3 className="font-extrabold text-dark-gray text-sm mb-4">Distribusi Status KKA</h3>
          {audits.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="KKA" radius={[6, 6, 0, 0]}>
                  {statusData.map(entry => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* OPD Type Pie */}
        <div className="bg-white rounded-2xl p-6 border border-dark-gray/10 shadow-sm">
          <h3 className="font-extrabold text-dark-gray text-sm mb-4">Distribusi Tipe Objek Audit</h3>
          {opdTypeData.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={opdTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  innerRadius={30}
                  paddingAngle={2}
                  label={({ name, percent }) => percent > 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {opdTypeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [`${v} KKA`, name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Temuan per OPD */}
        {temuanData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-dark-gray/10 shadow-sm lg:col-span-2">
            <h3 className="font-extrabold text-dark-gray text-sm mb-1">Jumlah Temuan per Objek Audit</h3>
            <p className="text-[10px] text-slate-400 font-semibold mb-4">Top {temuanData.length} objek dengan temuan terbanyak</p>
            <ResponsiveContainer width="100%" height={Math.max(200, temuanData.length * 38)}>
              <BarChart data={temuanData} layout="vertical" barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={145} tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="temuan" name="Temuan" fill="#ef4444" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Per Fiscal Year */}
        {yearData.length >= 1 && (
          <div className={`bg-white rounded-2xl p-6 border border-dark-gray/10 shadow-sm ${temuanData.length === 0 ? 'lg:col-span-2' : ''}`}>
            <h3 className="font-extrabold text-dark-gray text-sm mb-4">KKA per Tahun Anggaran</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yearData} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="KKA" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabel rekap */}
      {audits.length > 0 && (
        <div className="bg-white rounded-2xl border border-dark-gray/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-extrabold text-dark-gray text-sm">Rekap Lengkap KKA</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                <tr>
                  <th className="text-left px-4 py-3">Objek Audit</th>
                  <th className="text-left px-4 py-3">Tipe</th>
                  <th className="text-left px-4 py-3">TA</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Temuan</th>
                  <th className="text-right px-4 py-3">Nilai Temuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {audits.map(a => {
                  let temuan = 0, nilai = 0;
                  a.categories.forEach(c => c.items.forEach(i => { if (i.status === 'Temuan') { temuan++; nilai += i.nilaiTemuan || 0; } }));
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800 max-w-[200px] truncate">{a.opdName}</td>
                      <td className="px-4 py-3 text-slate-500">{a.opdType}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{a.fiscalYear}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border ${
                          a.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          a.status === 'Direview' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          a.status === 'Sedang Berjalan' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {temuan > 0 ? <span className="font-black text-rose-600 font-mono">{temuan}</span> : <span className="text-slate-300">\u2014</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {nilai > 0 ? formatRupiah(nilai) : <span className="text-slate-300">\u2014</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
