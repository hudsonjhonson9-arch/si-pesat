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
  HelpCircle,
  X
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

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');

  const activeCategory = allCategories.find(c => c.id === selectedCatId) || null;

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

  const startEditingCat = (cat: TemplateCategory) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description);
  };

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

  const startEditingItem = (item: TemplateItem) => {
    setEditingItemId(item.id);
    setEditItemTitle(item.title);
    setEditItemDesc(item.description);
  };

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
    <div className="space-y-6 text-dark-gray animate-fade-in" id="template-configurator-view">
      {/* Info Notice */}
      <div className="bg-baby-blue/60 border border-dark-gray/5 text-dark-gray p-4 rounded-2xl text-xs space-y-1.5 shadow-xs">
        <div className="flex items-center gap-1.5 font-extrabold text-dark-gray">
          <AlertCircle className="w-4 h-4 text-dark-gray/50 flex-shrink-0" />
          <span>Konfigurasi Jenis Audit Pemeriksaan Dinamis</span>
        </div>
        <p className="leading-relaxed font-semibold text-dark-gray/80">
          Kriteria dan Jenis Audit di halaman ini adalah <strong>master jenis audit default</strong>. Setiap kali Anda menekan tombol <strong>"Mulai Audit Baru"</strong> di beranda, struktur daftar periksa akan disalin langsung dari apa yang Anda atur di bawah ini. Audit yang sudah berjalan tidak akan terpengaruh.
        </p>
      </div>

      {/* Actions Panel */}
      <div className="flex items-center justify-end gap-4 flex-wrap bg-baby-blue px-4 py-3.5 border border-dark-gray/5 rounded-2xl shadow-xs">
        <button
          onClick={() => {
            const confirmed = window.confirm('Apakah Anda yakin ingin menyetel ulang semua template ke standar Dana BOS Nasional Inspektorat? Semua kustomisasi Anda akan dihapus.');
            if (confirmed) {
              onResetTemplates();
            }
          }}
          className="bg-white border border-dark-gray/15 hover:bg-peach-accent/20 hover:border-peach-accent/40 text-dark-gray text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition duration-150 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Atur Ulang Standar
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Daftar Jenis Audit */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-dark-gray/10 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-dark-gray/40" />
              <span className="text-[10px] uppercase font-extrabold text-dark-gray/70 tracking-wider">Jenis Audit</span>
              <span className="text-[10px] text-dark-gray/40 font-bold font-mono">({allCategories.length})</span>
            </div>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="bg-peach-accent border border-dark-gray/10 text-dark-gray text-xs font-black px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 hover:opacity-85 transition duration-150 cursor-pointer shadow-xs"
            >
              <Plus className="w-3 h-3" /> Tambah
            </button>
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {allCategories.map(cat => {
              const isActive = cat.id === selectedCatId;
              const isEditingThis = editingCatId === cat.id;
              const itemCount = cat.items.length;

              if (isEditingThis) {
                return (
                  <div key={cat.id} className="bg-white p-3 rounded-xl border border-dark-gray/15 shadow-sm space-y-2 text-xs">
                    <input
                      type="text"
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      className="w-full text-xs font-bold p-2 border border-dark-gray/15 rounded-lg bg-white text-dark-gray outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent"
                      placeholder="Nama Jenis Audit"
                    />
                    <textarea
                      value={editCatDesc}
                      onChange={e => setEditCatDesc(e.target.value)}
                      className="w-full text-[11px] font-medium p-2 border border-dark-gray/15 rounded-lg bg-white resize-none text-dark-gray outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent"
                      rows={2}
                      placeholder="Deskripsi Seksi"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="px-3 py-1.5 bg-white text-dark-gray border border-dark-gray/15 rounded-lg cursor-pointer font-bold text-xs hover:bg-slate-50 transition duration-150"
                      >
                        Batal
                      </button>
                      <button
                        onClick={saveCategoryEdit}
                        className="px-3 py-1.5 bg-dark-gray text-white rounded-lg font-black text-xs cursor-pointer shadow-xs hover:bg-dark-gray/85 transition duration-150"
                      >
                        <Check className="w-3 h-3 inline mr-1" />OK
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`group relative flex items-center justify-between text-xs p-2.5 rounded-xl cursor-pointer transition duration-150 border ${
                    isActive
                      ? 'bg-dark-gray border-dark-gray text-white shadow-sm font-bold'
                      : 'bg-cream-bg/50 border-dark-gray/5 text-dark-gray hover:bg-baby-blue/60 font-semibold'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-peach-accent rounded-full" />
                  )}
                  <div className="flex items-center gap-1.5 truncate min-w-0 pl-1">
                    <span className="truncate">{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                      isActive ? 'bg-white/15 text-white' : 'bg-dark-gray/8 text-dark-gray/50'
                    }`}>
                      {itemCount}
                    </span>
                  </div>

                  <div className={`absolute right-2 flex items-center gap-1 transition-opacity duration-150 ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingCat(cat);
                      }}
                      className={`p-1.5 rounded-lg transition-colors shadow-sm border cursor-pointer ${
                        isActive
                          ? 'bg-white/15 text-white border-white/20 hover:bg-white hover:text-dark-gray'
                          : 'bg-white text-dark-gray/60 border-dark-gray/10 hover:bg-peach-accent hover:text-dark-gray'
                      }`}
                      title="Ubah Seksi"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors shadow-sm border cursor-pointer ${
                        isActive
                          ? 'bg-rose-500/20 text-white border-rose-500/30 hover:bg-rose-500 hover:border-rose-500'
                          : 'bg-white text-rose-500/70 border-rose-100 hover:bg-rose-100 hover:text-rose-700'
                      }`}
                      title="Hapus Seksi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Category Items */}
        <div className="lg:col-span-8 space-y-4">
          {activeCategory ? (
            <>
              {/* Active Category Header */}
              <div className="bg-dark-gray rounded-2xl shadow-md p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <ListOrdered className="w-4 h-4 text-peach-accent" />
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-extrabold tracking-wide">
                    Seksi Aktif
                  </span>
                </div>
                <h3 className="text-lg font-bold leading-tight font-serif-display">{activeCategory.name}</h3>
                {activeCategory.description && (
                  <p className="text-xs text-white/70 leading-relaxed max-w-2xl mt-1 font-medium">{activeCategory.description}</p>
                )}
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-dark-gray/70 uppercase tracking-wider">
                    Kriteria Default <span className="text-dark-gray/40 font-normal normal-case tracking-normal">({activeCategory.items.length})</span>
                  </span>
                  <button
                    onClick={() => setIsAddingItem(true)}
                    className="bg-peach-accent border border-dark-gray/10 hover:opacity-85 text-xs font-black text-dark-gray px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer shadow-xs transition duration-150"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Kriteria
                  </button>
                </div>

                <div className="space-y-3">
                  {activeCategory.items.map((item, idx) => {
                    const isEditingThisItem = editingItemId === item.id;

                    if (isEditingThisItem) {
                      return (
                        <div key={item.id} className="bg-white border border-dark-gray/10 rounded-2xl p-4 space-y-3 shadow-sm">
                          <label className="text-[10px] font-bold text-dark-gray/70 uppercase flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full bg-peach-accent/20 text-peach-accent flex items-center justify-center text-[9px] font-black">{idx + 1}</span>
                            Dokumen Uji
                          </label>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editItemTitle}
                              onChange={e => setEditItemTitle(e.target.value)}
                              className="w-full text-xs font-bold p-2 border border-dark-gray/15 rounded-lg bg-white text-dark-gray outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent"
                              placeholder="Judul Dokumen"
                            />
                            <textarea
                              value={editItemDesc}
                              onChange={e => setEditItemDesc(e.target.value)}
                              className="w-full text-xs font-medium p-2 border border-dark-gray/15 rounded-lg bg-white resize-none text-dark-gray outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent"
                              rows={3}
                              placeholder="Uraian detail dokumen pembuktian SPJ / administrasi..."
                            />
                          </div>
                          <div className="flex justify-end gap-1.5 pt-2 border-t border-dark-gray/10">
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              className="px-3 py-1.5 bg-white border border-dark-gray/15 text-dark-gray rounded-lg font-bold text-xs cursor-pointer hover:bg-slate-50 transition duration-150"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={saveItemEdit}
                              className="px-4 py-1.5 bg-dark-gray text-white rounded-lg font-black text-xs cursor-pointer shadow-xs hover:bg-dark-gray/85 transition duration-150"
                            >
                              <Save className="w-3 h-3 inline mr-1" /> Simpan
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="bg-white border border-dark-gray/10 rounded-2xl p-4 flex items-start justify-between gap-4 hover:border-dark-gray/25 transition shadow-sm group">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-peach-accent/20 text-peach-accent flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="space-y-1 min-w-0">
                            <h5 className="text-xs font-bold text-dark-gray">{item.title}</h5>
                            <p className="text-xs text-dark-gray/70 font-medium leading-relaxed">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => startEditingItem(item)}
                            className="p-1.5 bg-white text-dark-gray/60 border border-dark-gray/10 hover:bg-peach-accent hover:text-dark-gray rounded-lg transition duration-150 shadow-sm cursor-pointer"
                            title="Ubah Dokumen"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 bg-white text-rose-500/70 border border-rose-100 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition duration-150 shadow-sm cursor-pointer"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-dark-gray/20 p-12 text-center select-none shadow-sm">
              <Layers className="w-10 h-10 mx-auto mb-3 text-dark-gray/20" />
              <p className="text-sm font-bold text-dark-gray/50">Pilih jenis audit di sebelah kiri</p>
              <p className="text-xs text-dark-gray/40 mt-1">atau tambah jenis audit baru untuk memulai</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Category */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsAddingCategory(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-dark-gray/10"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-gray/10 bg-baby-blue">
              <span className="font-extrabold text-xs tracking-wide text-dark-gray flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-dark-gray/50" /> Tambah Jenis Audit Baru
              </span>
              <button onClick={() => setIsAddingCategory(false)} className="text-dark-gray/50 hover:text-dark-gray cursor-pointer transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Nama Seksi</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: VI. Pengelolaan Hubungan Masyarakat"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Ruang Lingkup</label>
                <textarea
                  placeholder="Deskripsikan pengujian dokumen pada seksi ini..."
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-medium border border-dark-gray/15 p-2 rounded-lg bg-white resize-none text-dark-gray outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent"
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-dark-gray/10">
                <button type="button" onClick={() => setIsAddingCategory(false)}
                  className="flex-1 py-2 bg-white border border-dark-gray/15 rounded-lg font-bold text-dark-gray cursor-pointer hover:bg-slate-50 transition duration-150">
                  Batal
                </button>
                <button type="submit"
                  className="flex-1 py-2 bg-peach-accent border border-dark-gray/10 rounded-lg font-black text-dark-gray hover:opacity-85 cursor-pointer transition duration-150 shadow-xs">
                  <Plus className="w-3 h-3 inline mr-1" /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Item */}
      {isAddingItem && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setIsAddingItem(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-dark-gray/10"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-gray/10 bg-baby-blue">
              <span className="font-extrabold text-xs tracking-wide text-dark-gray flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-dark-gray/50" /> Tambah Kriteria Default
              </span>
              <button onClick={() => setIsAddingItem(false)} className="text-dark-gray/50 hover:text-dark-gray cursor-pointer transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Nama Dokumen Pemeriksaan</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pembayaran Pajak Bumi Bangunan OPD"
                  value={newItemTitle}
                  onChange={e => setNewItemTitle(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white text-dark-gray outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Petunjuk Pengujian</label>
                <textarea
                  placeholder="Deskripsikan bukti verkap fiktif, markup, atau kesesuaian administrasi juknis..."
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-medium border border-dark-gray/15 p-2 rounded-lg bg-white resize-none text-dark-gray outline-none focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent"
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-dark-gray/10">
                <button type="button" onClick={() => setIsAddingItem(false)}
                  className="flex-1 py-2 bg-white border border-dark-gray/15 rounded-lg font-bold text-dark-gray cursor-pointer hover:bg-slate-50 transition duration-150">
                  Batal
                </button>
                <button type="submit"
                  className="flex-1 py-2 bg-peach-accent border border-dark-gray/10 rounded-lg font-black text-dark-gray hover:opacity-85 cursor-pointer transition duration-150 shadow-xs">
                  <Plus className="w-3 h-3 inline mr-1" /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
