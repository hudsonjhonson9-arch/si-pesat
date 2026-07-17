/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useCallback } from 'react';
import { OpdAudit } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, CheckCircle, FileText, Activity,
  Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight
} from 'lucide-react';

interface StatistikViewProps {
  audits: OpdAudit[];
  userRole?: string;
}

const STATUS_COLORS: Record<string, string> = {
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
    <div className="bg-white border border-dark-gray/10 shadow-lg rounded-xl px-3 py-2 text-xs">
      <p className="font-bold text-dark-gray mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill || p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

type SortKey = 'opdName' | 'opdType' | 'auditType' | 'fiscalYear' | 'auditorName' | 'status' | 'progress' | 'temuan' | 'nilai';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

export default function StatistikView({ audits }: StatistikViewProps) {
  // --- Rekap table state ---
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('fiscalYear');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  // --- Chart data ---
  const statusData = useMemo(() => {
    const counts: Record<string, number> = { 'Sedang Berjalan': 0, 'Direview': 0, 'Selesai': 0 };
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

  // --- Rekap rows with computed fields ---
  const rekapRows = useMemo(() => {
    return audits.map(a => {
      let temuan = 0, nilai = 0;
      a.categories.forEach(c => c.items.forEach(i => {
        if (i.status === 'Temuan') { temuan++; nilai += i.nilaiTemuan || 0; }
      }));
      return { audit: a, temuan, nilai };
    });
  }, [audits]);

  // Grand total for footer
  const grandTotal = useMemo(() => ({
    temuan: rekapRows.reduce((s, r) => s + r.temuan, 0),
    nilai: rekapRows.reduce((s, r) => s + r.nilai, 0),
  }), [rekapRows]);

  // Sort helper
  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }, [sortKey]);

  // Filtered & sorted rows
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    let rows = q
      ? rekapRows.filter(r =>
          r.audit.opdName.toLowerCase().includes(q) ||
          r.audit.opdType.toLowerCase().includes(q) ||
          r.audit.auditType.toLowerCase().includes(q) ||
          r.audit.fiscalYear.includes(q) ||
          r.audit.auditorName.toLowerCase().includes(q) ||
          r.audit.status.toLowerCase().includes(q)
        )
      : [...rekapRows];

    rows.sort((a, b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case 'opdName':     va = a.audit.opdName;       vb = b.audit.opdName;       break;
        case 'opdType':     va = a.audit.opdType;       vb = b.audit.opdType;       break;
        case 'auditType':   va = a.audit.auditType;     vb = b.audit.auditType;     break;
        case 'fiscalYear':  va = a.audit.fiscalYear;    vb = b.audit.fiscalYear;    break;
        case 'auditorName': va = a.audit.auditorName;   vb = b.audit.auditorName;   break;
        case 'status':      va = a.audit.status;        vb = b.audit.status;        break;
        case 'progress':    va = a.audit.progress;      vb = b.audit.progress;      break;
        case 'temuan':      va = a.temuan;              vb = b.temuan;              break;
        case 'nilai':       va = a.nilai;               vb = b.nilai;               break;
        default:            va = a.audit.fiscalYear;    vb = b.audit.fiscalYear;
      }
      if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb), 'id')
        : String(vb).localeCompare(String(va), 'id');
    });

    return rows;
  }, [rekapRows, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page on search change
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-peach-accent" />
      : <ArrowDown className="w-3 h-3 text-peach-accent" />;
  };

  const ThSort = ({ k, label, className = '' }: { k: SortKey; label: string; className?: string }) => (
    <th
      className={`px-3 py-3 cursor-pointer select-none group ${className}`}
      onClick={() => handleSort(k)}
    >
      <div className="flex items-center gap-1 group-hover:text-dark-gray transition-colors">
        {label}
        <SortIcon k={k} />
      </div>
    </th>
  );

  const EmptyState = () => (
    <div className="h-48 flex flex-col items-center justify-center text-dark-gray/30 gap-2">
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: <FileText className="w-5 h-5 text-dark-gray" />, bg: 'bg-baby-blue', value: totals.kka, label: 'Total KKA', sub: `${totals.kka} pemeriksaan` },
          { icon: <CheckCircle className="w-5 h-5 text-dark-gray" />, bg: 'bg-pastel-green', value: totals.selesai, label: 'KKA Selesai', sub: `${completionPct}% dari total` },
          { icon: <TrendingUp className="w-5 h-5 text-dark-gray" />, bg: 'bg-pastel-yellow', value: totals.nilai > 0 ? formatRupiah(totals.nilai) : 'Rp 0', label: 'Nilai Temuan', sub: 'akumulasi keuangan' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-dark-gray/10 shadow-sm">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>{card.icon}</div>
            <p className="text-2xl font-black text-dark-gray leading-none">{card.value}</p>
            <p className="text-[10px] font-bold text-dark-gray/60 uppercase tracking-wider mt-1">{card.label}</p>
            <p className="text-[9px] text-dark-gray/40 font-semibold mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Per-category completion */}
      {(() => {
        const totalCats = audits.reduce((s, a) => s + a.categories.length, 0);
        const doneCats = audits.reduce((s, a) => s + a.categories.filter(c => c.status === 'Selesai').length, 0);
        const catPct = totalCats > 0 ? Math.round((doneCats / totalCats) * 100) : 0;
        return totalCats > totals.kka ? (
          <div className="bg-white rounded-2xl p-4 border border-dark-gray/10 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-dark-gray/60 uppercase tracking-wider">Kategori Selesai</span>
              <span className="text-xs font-black text-dark-gray font-mono">{doneCats}/{totalCats} ({catPct}%)</span>
            </div>
            <div className="w-full bg-baby-blue/40 rounded-full h-2 overflow-hidden">
              <div className="h-2 rounded-full bg-pastel-green transition-all duration-700" style={{ width: `${catPct}%` }} />
            </div>
          </div>
        ) : null;
      })()}

      {/* Global Progress */}
      {totals.kka > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-dark-gray/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-dark-gray">Progres Penyelesaian Keseluruhan</span>
            <span className="text-xs font-black text-dark-gray font-mono">{completionPct}%</span>
          </div>
          <div className="w-full bg-baby-blue/40 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-peach-accent to-pastel-green transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 flex-wrap">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s.name] }} />
                <span className="text-[10px] font-semibold text-dark-gray/60">{s.name}: <strong className="text-dark-gray">{s.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-dark-gray/10 shadow-sm">
          <h3 className="font-extrabold text-dark-gray text-sm mb-4">Status KKA</h3>
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
          <h3 className="font-extrabold text-dark-gray text-sm mb-4">Tipe Objek Audit</h3>
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
            <h3 className="font-extrabold text-dark-gray text-sm mb-1">Temuan per Objek Audit</h3>
            <p className="text-[10px] text-dark-gray/50 font-semibold mb-4">Top {temuanData.length} dengan temuan terbanyak</p>
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
            <h3 className="font-extrabold text-dark-gray text-sm mb-4">per Tahun Anggaran</h3>
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

      {/* ═══════════════════════════════════════════════════════
          REKAP LENGKAP KKA — Improved Table
          ═══════════════════════════════════════════════════════ */}
      {audits.length > 0 && (
        <div className="bg-white rounded-2xl border border-dark-gray/10 shadow-sm overflow-hidden">
          {/* Header + Search */}
          <div className="px-6 py-4 border-b border-dark-gray/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-dark-gray text-sm">Rekap Lengkap</h3>
              <p className="text-[10px] text-dark-gray/50 font-semibold mt-0.5">
                {filteredRows.length} dari {rekapRows.length} KKA
                {search && <span className="text-peach-accent ml-1">· filter aktif</span>}
              </p>
            </div>
            {/* Search box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-gray/40 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Cari nama, tipe, auditor…"
                className="w-full pl-8 pr-3 py-2 text-xs border border-dark-gray/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent placeholder:text-dark-gray/30 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[860px]">
              <thead className="bg-baby-blue/40 text-dark-gray/70 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                <tr>
                  <th className="text-left px-3 py-3 w-8">#</th>
                  <ThSort k="opdName"     label="Objek Audit"   className="text-left" />
                  <ThSort k="opdType"     label="Tipe"          className="text-left" />
                  <ThSort k="auditType"   label="Jenis Audit"   className="text-left" />
                  <ThSort k="fiscalYear"  label="TA"            className="text-left" />
                  <ThSort k="auditorName" label="Auditor"       className="text-left" />
                  <ThSort k="status"      label="Status"        className="text-center" />
                  <ThSort k="progress"    label="Progres"       className="text-center" />
                  <ThSort k="temuan"      label="Temuan"        className="text-center" />
                  <ThSort k="nilai"       label="Nilai Temuan"  className="text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-gray/5">
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-dark-gray/30 text-xs font-bold italic">
                      Tidak ada data yang cocok
                    </td>
                  </tr>
                ) : pagedRows.map((r, idx) => {
                  const globalIdx = (page - 1) * PAGE_SIZE + idx + 1;
                  const a = r.audit;
                  const prog = Math.min(100, Math.max(0, a.progress ?? 0));
                  const progColor =
                    prog === 100 ? 'bg-emerald-400' :
                    prog >= 50   ? 'bg-blue-400'    :
                    prog > 0     ? 'bg-amber-400'   : 'bg-slate-200';

                  return (
                    <tr key={a.id} className="hover:bg-baby-blue/20 transition-colors">
                      {/* No. */}
                      <td className="px-3 py-3 text-dark-gray/30 font-mono font-bold text-[10px]">{globalIdx}</td>

                      {/* Objek Audit */}
                      <td className="px-3 py-3">
                        <span className="font-bold text-dark-gray block max-w-[180px] truncate" title={a.opdName}>
                          {a.opdName}
                        </span>
                      </td>

                      {/* Tipe */}
                      <td className="px-3 py-3 text-dark-gray/60 whitespace-nowrap">{a.opdType}</td>

                      {/* Jenis Audit */}
                      <td className="px-3 py-3 text-dark-gray/60 whitespace-nowrap max-w-[120px] truncate" title={a.auditType}>
                        {a.auditType || <span className="text-dark-gray/20">&mdash;</span>}
                      </td>

                      {/* TA */}
                      <td className="px-3 py-3 font-mono text-dark-gray/60 whitespace-nowrap">{a.fiscalYear}</td>

                      {/* Auditor */}
                      <td className="px-3 py-3 text-dark-gray/60 whitespace-nowrap max-w-[130px] truncate" title={a.auditorName}>
                        {a.auditorName || <span className="text-dark-gray/20">&mdash;</span>}
                      </td>

                      {/* Status badge */}
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border whitespace-nowrap ${
                          a.status === 'Selesai'         ? 'bg-pastel-green/40 text-dark-gray border-pastel-green' :
                          a.status === 'Direview'        ? 'bg-pastel-yellow/50 text-dark-gray border-pastel-yellow' :
                          a.status === 'Sedang Berjalan' ? 'bg-pastel-blue/50 text-dark-gray border-pastel-blue' :
                                                           'bg-dark-gray/8 text-dark-gray/50 border-dark-gray/10'
                        }`}>{a.status}</span>
                      </td>

                      {/* Progres mini-bar */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-dark-gray/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${progColor}`}
                              style={{ width: `${prog}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-dark-gray/60 w-7 text-right">{prog}%</span>
                        </div>
                      </td>

                      {/* Temuan count */}
                      <td className="px-3 py-3 text-center">
                        {r.temuan > 0
                          ? <span className="font-black text-rose-600 font-mono bg-pastel-pink px-1.5 py-0.5 rounded-md">{r.temuan}</span>
                          : <span className="text-dark-gray/20">&mdash;</span>
                        }
                      </td>

                      {/* Nilai Temuan */}
                      <td className="px-3 py-3 text-right font-mono text-dark-gray whitespace-nowrap">
                        {r.nilai > 0 ? formatRupiah(r.nilai) : <span className="text-dark-gray/20">&mdash;</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Grand total footer */}
              {filteredRows.length > 0 && (
                <tfoot>
                  <tr className="bg-baby-blue/30 border-t-2 border-dark-gray/10 font-black text-dark-gray text-[10px]">
                    <td className="px-3 py-3 text-dark-gray/50" colSpan={8}>
                      Total ({filteredRows.length} KKA)
                    </td>
                    <td className="px-3 py-3 text-center text-rose-600 font-mono">
                      {grandTotal.temuan > 0 ? grandTotal.temuan : <span className="text-dark-gray/20">&mdash;</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-dark-gray">
                      {grandTotal.nilai > 0 ? formatRupiah(grandTotal.nilai) : <span className="text-dark-gray/20">&mdash;</span>}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-dark-gray/8 flex items-center justify-between">
              <span className="text-[10px] text-dark-gray/50 font-semibold">
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-dark-gray/15 text-dark-gray/60 hover:bg-baby-blue/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...'
                      ? <span key={`ellipsis-${i}`} className="px-1 text-[10px] text-dark-gray/30">…</span>
                      : <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`min-w-[28px] h-7 rounded-lg text-[10px] font-bold border transition-colors ${
                            page === p
                              ? 'bg-peach-accent text-white border-peach-accent'
                              : 'border-dark-gray/15 text-dark-gray/60 hover:bg-baby-blue/40'
                          }`}
                        >{p}</button>
                  )
                }
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-dark-gray/15 text-dark-gray/60 hover:bg-baby-blue/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
