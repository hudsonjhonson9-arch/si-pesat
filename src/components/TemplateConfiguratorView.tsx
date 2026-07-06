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
    <div className="space-y-3 text-dark-gray" id="template-configurator-view">
      {/* Configure Alert notice */}
      <div className="bg-amber-100/40 border border-amber-200/40 text-dark-gray p-3 rounded-xl text-[11px] shadow-xs">
        <div className="flex items-center gap-1.5 font-bold text-dark-gray/80">
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
          <span>Konfigurasi Jenis Audit Dinamis</span>
        </div>
        <p className="mt-0.5 leading-relaxed font-medium text-dark-gray/70">
          Master jenis audit default. Struktur daftar periksa akan disalin saat <strong>"Mulai Audit Baru"</strong>. Audit berjalan tidak terpengaruh.
        </p>
      </div>

      {/* Controller Actions Panel */}
      <div className="flex items-center justify-end bg-baby-blue p-2.5 border border-dark-gray/10 rounded-xl shadow-xs">
        <button
          onClick={() => {
            const confirmed = window.confirm('Apakah Anda yakin ingin menyetel ulang semua template ke standar Dana BOS Nasional Inspektorat? Semua kustomisasi Anda akan dihapus.');
            if (confirmed) {
              onResetTemplates();
            }
          }}
          className="bg-white border border-dark-gray/15 hover:bg-white/85 text-dark-gray text-[11px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Atur Ulang Standar
        </button>
      </div>

      {/* Main Dual Grid config layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Category config column */}
        <div className="lg:col-span-4 bg-baby-blue p-3 border border-dark-gray/10 rounded-xl shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-dark-gray/50" />
              <span className="text-[10px] uppercase font-bold text-dark-gray/70 tracking-wider">Jenis Audit</span>
              <span className="text-[10px] font-bold text-dark-gray/40 font-mono">{allCategories.length}</span>
            </div>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="text-[11px] text-dark-gray/90 hover:text-dark-gray font-black inline-flex items-center gap-0.5 cursor-pointer"
            >
              <PlusCircle className="w-3 h-3" /> Tambah
            </button>
          </div>

          <div className="space-y-1 max-h-[420px] overflow-y-auto">
              {allCategories.map(cat => {
              const isActive = cat.id === selectedCatId;
              const isEditingThis = editingCatId === cat.id;
              const itemCount = cat.items.length;

              if (isEditingThis) {
                return (
                  <div key={cat.id} className="bg-white p-2 rounded-lg border border-dark-gray/15 space-y-1.5 text-[11px]">
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
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="px-2 py-1 bg-white text-dark-gray border border-dark-gray/15 rounded-lg cursor-pointer font-bold"
                      >
                        Batal
                      </button>
                      <button
                        onClick={saveCategoryEdit}
                        className="px-2.5 py-1 bg-peach-accent text-dark-gray border border-dark-gray/10 rounded-lg font-black cursor-pointer shadow-xs"
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
                  className={`group relative flex items-center justify-between text-[11px] p-2 rounded-lg cursor-pointer transition border ${isActive
                      ? 'bg-dark-gray border-transparent text-white shadow-xs font-bold'
                      : 'bg-white/40 border-dark-gray/5 text-dark-gray hover:bg-white/60 font-semibold'
                    }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0.5 bottom-0.5 w-0.5 bg-peach-accent rounded-full" />
                  )}
                  <div className="flex items-center gap-1 truncate min-w-0 pr-12">
                    <span className="truncate">{cat.name}</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded-full font-bold shrink-0 ${
                      isActive ? 'bg-white/15 text-white' : 'bg-dark-gray/8 text-dark-gray/50'
                    }`}>
                      {itemCount}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className={`absolute right-1.5 flex items-center gap-1 transition-opacity duration-150 ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingCat(cat);
                      }}
                      className={`p-1 rounded-lg transition-colors shadow-sm border cursor-pointer ${isActive ? 'bg-white/20 text-white border-white/30 hover:bg-white hover:text-dark-gray' : 'bg-white/80 text-dark-gray/60 border-dark-gray/10 hover:bg-peach-accent/80'}`}
                      title="Ubah Seksi"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }}
                      className={`p-1 rounded-lg transition-colors shadow-sm border cursor-pointer ${isActive ? 'bg-rose-500/20 text-white border-rose-500/30 hover:bg-rose-500 hover:border-rose-500' : 'bg-white/80 text-rose-500/70 border-rose-100 hover:bg-rose-100 hover:text-rose-700'}`}
                      title="Hapus Seksi"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Category Items List configurations */}
        <div className="lg:col-span-8 space-y-3">
          {activeCategory ? (
            <div className="space-y-3">
              {/* Category Scope Title Bar */}
              <div className="bg-dark-gray shadow-md p-3 rounded-xl text-white">
                <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded font-mono font-bold tracking-wide">
                  Seksi Aktif
                </span>
                <h4 className="text-sm font-extrabold text-white mt-1.5 leading-tight">{activeCategory.name}</h4>
                {activeCategory.description && (
                  <p className="text-[11px] text-white/70 leading-relaxed max-w-2xl mt-0.5 font-medium">{activeCategory.description}</p>
                )}
              </div>

              {/* Items config list wrapper */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-dark-gray/70 uppercase tracking-wider">
                    Kriteria <span className="text-dark-gray/40 font-normal normal-case tracking-normal">({activeCategory.items.length})</span>
                  </span>
                  <button
                    onClick={() => setIsAddingItem(true)}
                    className="bg-baby-blue hover:opacity-95 border border-dark-gray/10 text-[11px] font-bold text-dark-gray px-2 rounded-lg py-1 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 font-bold" /> Tambah
                  </button>
                </div>

                <div className="space-y-2">
                  {activeCategory.items.map((item, idx) => {
                    const isEditingThisItem = editingItemId === item.id;

                    if (isEditingThisItem) {
                      return (
                        <div key={item.id} className="bg-white border border-dark-gray/10 rounded-xl p-3 space-y-2.5 text-xs animate-slide-up">
                          <label className="text-[10px] font-bold text-dark-gray/70 uppercase flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full bg-peach-accent/20 text-dark-gray flex items-center justify-center text-[9px] font-black">{idx + 1}</span>
                            Dokumen Uji
                          </label>
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={editItemTitle}
                              onChange={e => setEditItemTitle(e.target.value)}
                              className="w-full text-xs font-bold p-1.5 border border-dark-gray/15 rounded-lg bg-white text-dark-gray outline-none focus:border-dark-gray/30"
                              placeholder="Judul Dokumen"
                            />
                            <textarea
                              value={editItemDesc}
                              onChange={e => setEditItemDesc(e.target.value)}
                              className="w-full text-xs font-medium p-1.5 border border-dark-gray/15 rounded-lg bg-white resize-none text-dark-gray outline-none focus:border-dark-gray/30"
                              rows={2}
                              placeholder="Uraian detail dokumen pembuktian SPJ / administrasi..."
                            />
                          </div>
                          <div className="flex justify-end gap-1.5 pt-1.5 border-t border-dark-gray/10">
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              className="px-2 py-1 bg-white border border-dark-gray/15 text-dark-gray rounded-lg font-bold text-xs cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={saveItemEdit}
                              className="px-3 py-1 bg-peach-accent text-dark-gray border border-dark-gray/10 rounded-lg font-black text-xs cursor-pointer shadow-xs"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="bg-baby-blue border border-dark-gray/10 p-3 rounded-xl flex items-start justify-between gap-3 hover:border-dark-gray/25 transition shadow-xs group text-dark-gray">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-lg bg-peach-accent/25 text-dark-gray flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="space-y-0.5 min-w-0">
                            <h5 className="text-xs font-bold text-dark-gray">{item.title}</h5>
                            <p className="text-[11px] text-dark-gray/70 font-medium leading-relaxed pr-2">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => startEditingItem(item)}
                            className="p-1 bg-white/80 text-dark-gray/60 border border-dark-gray/10 hover:bg-peach-accent/80 rounded-lg transition shadow-sm cursor-pointer"
                            title="Ubah Dokumen"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 bg-white/80 text-rose-500/70 border border-rose-100 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition shadow-sm cursor-pointer"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 select-none bg-baby-blue/30 rounded-xl border border-dashed border-dark-gray/15 text-dark-gray">
              <Layers className="w-6 h-6 mx-auto mb-1 text-dark-gray/30" />
              <span className="text-xs font-bold text-dark-gray/60">Pilih jenis audit di sebelah kiri</span>
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
