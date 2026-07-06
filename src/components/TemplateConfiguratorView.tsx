/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KKATemplate, TemplateCategory, TemplateItem } from '../types';
import {
  Plus,
  Trash2,
  RotateCcw,
  Edit3,
  Save,
  Check,
  ListOrdered,
  Layers,
  PlusCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface TemplateConfiguratorViewProps {
  templates: KKATemplate[];
  onUpdateTemplates: (updatedTemplates: KKATemplate[]) => void;
  onResetTemplates: () => void;
}

export default function TemplateConfiguratorView({
  templates,
  onUpdateTemplates,
  onResetTemplates
}: TemplateConfiguratorViewProps) {

  const allCategories = React.useMemo(() =>
    templates.flatMap(t =>
      t.categories.map(c => ({ ...c, _templateId: t.id }))
    ),
    [templates]
  );

  const [selectedCatId, setSelectedCatId] = useState<string>('');

  // Sync selectedCatId when categories change
  React.useEffect(() => {
    if (allCategories.length > 0) {
      const exists = allCategories.find(c => c.id === selectedCatId);
      if (!exists) {
        setSelectedCatId(allCategories[0].id);
      }
    }
  }, [allCategories, selectedCatId]);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  // Editing state for categories
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  // Editing state for items
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');

  // Active Category helper
  const activeCategory = allCategories.find(c => c.id === selectedCatId) || null;

  // Add new Jenis Audit to the first template
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || templates.length === 0) return;

    const targetTemplate = templates[0];
    const newCat: TemplateCategory = {
      id: `cat_temp_${Date.now()}`,
      name: newCatName,
      description: newCatDesc,
      items: [
        {
          id: `item_temp_init_${Date.now()}`,
          title: 'Kriteria Pemeriksaan Definitif Pertama',
          description: 'Uraikan instruksi pemeriksaan spesifik kriteria baru ini.'
        }
      ]
    };

    const updatedTemplate = {
      ...targetTemplate,
      categories: [...targetTemplate.categories, newCat]
    };

    onUpdateTemplates(templates.map(t => t.id === targetTemplate.id ? updatedTemplate : t));
    setSelectedCatId(newCat.id);
    setNewCatName('');
    setNewCatDesc('');
    setIsAddingCategory(false);
  };

  // Delete category from master template
  const handleDeleteCategory = (catId: string) => {
    const found = allCategories.find(c => c.id === catId);
    if (!found) return;
    const srcTemplate = templates.find(t => t.id === found._templateId);
    if (!srcTemplate || srcTemplate.categories.length <= 1) {
      alert('Harus menyisakan minimal satu jenis audit.');
      return;
    }
    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus jenis audit ini? Semua kriteria default di dalamnya akan ikut dihapus.');
    if (!confirmed) return;

    const updatedTemplate = {
      ...srcTemplate,
      categories: srcTemplate.categories.filter(c => c.id !== catId)
    };
    onUpdateTemplates(templates.map(t => t.id === srcTemplate.id ? updatedTemplate : t));

    if (selectedCatId === catId) {
      setSelectedCatId(allCategories.filter(c => c.id !== catId)[0]?.id || '');
    }
  };

  // Add Item inside active template category
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle || !selectedCatId) return;

    const found = allCategories.find(c => c.id === selectedCatId);
    if (!found) return;
    const srcTemplate = templates.find(t => t.id === found._templateId);
    if (!srcTemplate) return;

    const newItem: TemplateItem = {
      id: `item_temp_user_${Date.now()}`,
      title: newItemTitle,
      description: newItemDesc
    };

    const updatedTemplate = {
      ...srcTemplate,
      categories: srcTemplate.categories.map(cat =>
        cat.id === selectedCatId
          ? { ...cat, items: [...cat.items, newItem] }
          : cat
      )
    };
    onUpdateTemplates(templates.map(t => t.id === srcTemplate.id ? updatedTemplate : t));

    setNewItemTitle('');
    setNewItemDesc('');
    setIsAddingItem(false);
  };

  // Delete item from category in master template
  const handleDeleteItem = (itemId: string) => {
    if (!selectedCatId || !activeCategory) return;
    if (activeCategory.items.length <= 1) {
      alert('Jenis Audit harus menyimpan minimal satu kriteria pemeriksaan.');
      return;
    }
    const found = allCategories.find(c => c.id === selectedCatId);
    if (!found) return;
    const srcTemplate = templates.find(t => t.id === found._templateId);
    if (!srcTemplate) return;

    const confirmed = window.confirm('Apakah Anda yakin ingin menghapus kriteria pemeriksaan default ini dari template master?');
    if (!confirmed) return;

    const updatedTemplate = {
      ...srcTemplate,
      categories: srcTemplate.categories.map(cat =>
        cat.id === selectedCatId
          ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
          : cat
      )
    };
    onUpdateTemplates(templates.map(t => t.id === srcTemplate.id ? updatedTemplate : t));
  };

  // Start editing category
  const startEditingCat = (cat: TemplateCategory) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description);
  };

  // Save category edits
  const saveCategoryEdit = () => {
    if (!editCatName) return;
    const found = allCategories.find(c => c.id === editingCatId);
    if (!found) return;
    const srcTemplate = templates.find(t => t.id === found._templateId);
    if (!srcTemplate) return;

    const updatedTemplate = {
      ...srcTemplate,
      categories: srcTemplate.categories.map(cat =>
        cat.id === editingCatId
          ? { ...cat, name: editCatName, description: editCatDesc }
          : cat
      )
    };
    onUpdateTemplates(templates.map(t => t.id === srcTemplate.id ? updatedTemplate : t));
    setEditingCatId(null);
  };

  // Start editing item
  const startEditingItem = (item: TemplateItem) => {
    setEditingItemId(item.id);
    setEditItemTitle(item.title);
    setEditItemDesc(item.description);
  };

  // Save item edits
  const saveItemEdit = () => {
    if (!editItemTitle || !selectedCatId) return;
    const found = allCategories.find(c => c.id === selectedCatId);
    if (!found) return;
    const srcTemplate = templates.find(t => t.id === found._templateId);
    if (!srcTemplate) return;

    const updatedTemplate = {
      ...srcTemplate,
      categories: srcTemplate.categories.map(cat =>
        cat.id === selectedCatId
          ? {
              ...cat,
              items: cat.items.map(it =>
                it.id === editingItemId
                  ? { ...it, title: editItemTitle, description: editItemDesc }
                  : it
              )
            }
          : cat
      )
    };
    onUpdateTemplates(templates.map(t => t.id === srcTemplate.id ? updatedTemplate : t));
    setEditingItemId(null);
  };

  return (
    <div className="space-y-6 text-dark-gray" id="template-configurator-view">
      {/* Configure Alert notice */}
      <div className="bg-amber-100/45 border border-amber-200/50 text-dark-gray p-4 rounded-xl text-xs space-y-1.5 shadow-xs">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-800 flex-shrink-0" />
          <span className="font-extrabold text-dark-gray">Konfigurasi Jenis Audit Pemeriksaan Dinamis (A.2)</span>
        </div>
        <p className="leading-relaxed font-semibold text-dark-gray/90">
          Kriteria dan Jenis Audit di halaman ini adalah <strong>master jenis audit default</strong>. Setiap kali Anda menekan tombol <strong>"Mulai Audit Baru"</strong> di beranda, struktur daftar periksa akan disalin langsung dari apa yang Anda atur di bawah ini. Audit yang sudah berjalan tidak akan terpengaruh.
        </p>
      </div>

      {/* Controller Actions Panel */}
      <div className="flex items-center justify-end gap-4 flex-wrap bg-baby-blue p-3.5 border border-dark-gray/10 rounded-xl shadow-xs">
        <button
          onClick={() => {
            const confirmed = window.confirm('Apakah Anda yakin ingin menyetel ulang semua template ke standar Dana BOS Nasional Inspektorat? Semua kustomisasi Anda akan dihapus.');
            if (confirmed) {
              onResetTemplates();
            }
          }}
          className="bg-white border border-dark-gray/15 hover:bg-white/85 text-dark-gray text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Batal & Atur Ulang Standar
        </button>
      </div>

      {/* Main Dual Grid config layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Category config column */}
        <div className="lg:col-span-4 bg-baby-blue p-4 border border-dark-gray/10 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-dark-gray/10">
            <span className="text-[10px] uppercase font-bold text-dark-gray/70 tracking-wider">Daftar Jenis Audit</span>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="text-xs text-dark-gray/90 hover:text-dark-gray font-black inline-flex items-center gap-0.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {allCategories.map(cat => {
              const isActive = cat.id === selectedCatId;
              const isEditingThis = editingCatId === cat.id;

              if (isEditingThis) {
                return (
                  <div key={cat.id} className="bg-white p-2.5 rounded-lg border border-dark-gray/15 space-y-2 text-xs">
                    <input
                      type="text"
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      className="w-full text-xs font-bold p-1.5 border border-dark-gray/15 rounded bg-white text-dark-gray outline-none focus:border-dark-gray/30"
                      placeholder="Nama Jenis Audit"
                    />
                    <textarea
                      value={editCatDesc}
                      onChange={e => setEditCatDesc(e.target.value)}
                      className="w-full text-[11px] font-medium p-1.5 border border-dark-gray/15 rounded bg-white resize-none text-dark-gray outline-none focus:border-dark-gray/30"
                      rows={2}
                      placeholder="Deskripsi Seksi"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="p-1 px-2 bg-white text-dark-gray border border-dark-gray/15 rounded-lg cursor-pointer font-bold"
                      >
                        Batal
                      </button>
                      <button
                        onClick={saveCategoryEdit}
                        className="p-1 px-3 bg-peach-accent text-dark-gray border border-dark-gray/10 rounded-lg font-black cursor-pointer shadow-xs"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`group relative flex items-center justify-between text-xs p-2.5 rounded-lg cursor-pointer transition border ${isActive
                      ? 'bg-dark-gray border-transparent text-white shadow-xs font-bold'
                      : 'bg-white/40 border-dark-gray/5 text-dark-gray hover:bg-white/60 font-semibold'
                    }`}
                >
                  <span className="truncate pr-16">{cat.name}</span>

                  {/* Actions buttons */}
                  <div className="absolute right-2 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingCat(cat);
                      }}
                      className={`p-2 rounded-lg transition-colors shadow-sm border ${isActive ? 'bg-white/20 text-white border-white/30 hover:bg-white hover:text-dark-gray' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800 cursor-pointer'}`}
                      title="Ubah Seksi"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }}
                      className={`p-2 rounded-lg transition-colors shadow-sm border ${isActive ? 'bg-rose-500/20 text-white border-rose-500/30 hover:bg-rose-500 hover:border-rose-500' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 hover:text-rose-700 cursor-pointer'}`}
                      title="Hapus Seksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Category Items List configurations */}
        <div className="lg:col-span-8 space-y-4">
          {activeCategory ? (
            <div className="space-y-4">
              {/* Category Scope Title Bar */}
              <div className="bg-dark-gray border border-white/5 shadow-md p-4 rounded-xl text-white">
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono font-bold tracking-wide">
                  Seksi Pengujian Aktif
                </span>
                <h4 className="text-sm font-extrabold text-white mt-2 leading-tight">{activeCategory.name}</h4>
                <p className="text-xs text-white/80 leading-relaxed max-w-2xl mt-1 font-medium">{activeCategory.description}</p>
              </div>

              {/* Items config list wrapper */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-dark-gray/70 uppercase tracking-wider block">Kriteria Default di Dalam Seksi Ini</span>
                  <button
                    onClick={() => setIsAddingItem(true)}
                    className="bg-baby-blue hover:opacity-95 border border-dark-gray/10 text-xs font-bold text-dark-gray px-2.5 rounded-lg py-1.5 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 font-bold" /> Sisipkan Dokumen Baru
                  </button>
                </div>

                <div className="space-y-3">
                  {activeCategory.items.map((item, idx) => {
                    const isEditingThisItem = editingItemId === item.id;

                    if (isEditingThisItem) {
                      return (
                        <div key={item.id} className="bg-white border border-dark-gray/10 rounded-xl p-4 space-y-3 text-xs animate-slide-up">
                          <label className="text-[10px] font-bold text-dark-gray/70 uppercase block">Dokumen Uji {idx + 1}</label>
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={editItemTitle}
                              onChange={e => setEditItemTitle(e.target.value)}
                              className="w-full text-xs font-bold p-2 border border-dark-gray/15 rounded-lg bg-white text-dark-gray outline-none focus:border-dark-gray/30"
                              placeholder="Judul Dokumen"
                            />
                            <textarea
                              value={editItemDesc}
                              onChange={e => setEditItemDesc(e.target.value)}
                              className="w-full text-xs font-medium p-2 border border-dark-gray/15 rounded-lg bg-white resize-none text-dark-gray outline-none focus:border-dark-gray/30"
                              rows={3}
                              placeholder="Uraian detail dokumen pembuktian SPJ / administrasi..."
                            />
                          </div>
                          <div className="flex justify-end gap-1.5 pt-1 border-t border-dark-gray/10">
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              className="p-1.5 px-2 bg-white border border-dark-gray/15 text-dark-gray rounded-lg font-bold cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={saveItemEdit}
                              className="p-1.5 px-3.5 bg-peach-accent text-dark-gray border border-dark-gray/10 rounded-lg font-black cursor-pointer shadow-xs"
                            >
                              Simpan Bukti
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="bg-baby-blue border border-dark-gray/10 p-4 rounded-xl flex items-start justify-between gap-4 hover:border-dark-gray/25 transition shadow-xs group text-dark-gray">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] bg-white/50 rounded text-dark-gray px-1.5 font-mono font-bold select-none">{idx + 1}</span>
                            <h5 className="text-xs font-bold text-dark-gray">{item.title}</h5>
                          </div>
                          <p className="text-xs text-dark-gray/80 font-medium leading-relaxed pr-6">{item.description}</p>
                        </div>

                        <div className="flex items-center justify-end gap-2 flex-shrink-0">
                          <button
                            onClick={() => startEditingItem(item)}
                            className="p-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition shadow-sm cursor-pointer"
                            title="Ubah Dokumen"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition shadow-sm cursor-pointer"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 select-none bg-baby-blue/30 rounded-xl border border-dashed border-dark-gray/15 text-dark-gray">
              <span className="text-xs font-bold text-dark-gray/60">Silakan pilih jenis audit di sebelah kiri untuk melihat dokumen.</span>
            </div>
          )}
        </div>
      </div>

      {/* Slide-Up Popup Modal to Add Categories */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-dark-gray/10 text-dark-gray">
            <div className="bg-dark-gray text-white px-4 py-3 flex items-center justify-between">
              <span className="font-extrabold text-xs tracking-wide">Tambah Jenis Audit Baru (A.1)</span>
              <button onClick={() => setIsAddingCategory(false)} className="text-white/80 hover:text-white font-xs font-bold cursor-pointer">Tutup</button>
            </div>
            <form onSubmit={handleAddCategory} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Nama Seksi KKA Baru</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: VI. Pengelolaan Hubungan Masyarakat"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white/70 focus:bg-white text-dark-gray outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Ruang Lingkup Deskripsi</label>
                <textarea
                  placeholder="Deskripsikan pengujian dokumen pada seksi Jenis Audit Baru..."
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-medium border border-dark-gray/15 p-2 rounded-lg bg-white/70 focus:bg-white resize-none outline-none text-dark-gray"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-dark-gray/10">
                <button type="button" onClick={() => setIsAddingCategory(false)} className="flex-1 bg-white py-2 border border-dark-gray/15 rounded-lg font-bold text-dark-gray cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 bg-peach-accent border border-dark-gray/10 py-2 rounded-lg font-black text-dark-gray hover:opacity-90 cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Up Popup Modal to Add Criteria Items */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-dark-gray/10 text-dark-gray">
            <div className="bg-dark-gray text-white px-4 py-3 flex items-center justify-between">
              <span className="font-extrabold text-xs tracking-wide">Tambah Dokumen Default Baru</span>
              <button onClick={() => setIsAddingItem(false)} className="text-white/80 hover:text-white font-xs font-bold cursor-pointer">Tutup</button>
            </div>
            <form onSubmit={handleAddItem} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Nama Dokumen Pemeriksaan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pembayaran Pajak Bumi Bangunan OPD"
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white/70 focus:bg-white text-dark-gray outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Petunjuk Pengujian (Deskripsi)</label>
                <textarea
                  placeholder="Deskripsikan bukti verkap fiktif, markup, atau kesesuaian administrasi juknis..."
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-medium border border-dark-gray/15 p-2 rounded-lg bg-white/70 focus:bg-white resize-none outline-none text-dark-gray"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-dark-gray/10">
                <button type="button" onClick={() => setIsAddingItem(false)} className="flex-1 bg-white py-2 border border-dark-gray/15 rounded-lg font-bold text-dark-gray cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 bg-peach-accent border border-dark-gray/10 py-2 rounded-lg font-black text-dark-gray hover:opacity-90 cursor-pointer">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
