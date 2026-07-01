# Spesifikasi Bukti & Pertanggungjawaban - Item Management

## Problem

1. Item "Spesifikasi Bukti & Pertanggungjawaban" di workspace hanya bisa dihapus, tidak bisa ditambah langsung.
   Item hanya berasal dari template — tidak bisa menyesuaikan kebutuhan di lapangan.
2. Di AuditListView, tombol hapus KKA selalu muncul meskipun hanya ada 1 KKA dalam grup, berisiko
   menghapus seluruh data tanpa sengaja.

## Solution

### 1. Workspace — Add Item

- Tombol **"+ Tambah Item"** di samping header "Spesifikasi Bukti & Pertanggungjawaban"
  (hanya untuk FUNGSIONAL_ROLES, tidak di read-only mode)
- Klik → muncul **inline form** dengan 2 field: judul + deskripsi
- Submit → item baru langsung masuk ke kategori aktif dengan `status: 'N/A'`, `id: item_temp_{timestamp}`
- Hapus item sudah ada — tidak perlu diubah

### 2. AuditListView — Conditional Delete

- Hitung jumlah audit (KKA) per grup OPD + tahun
- Tombol hapus hanya muncul jika `group.audits.length > 1`
- Jika cuma 1 KKA, tombol hapus disembunyikan

## Files Changed

| File | Change |
|---|---|
| `src/components/AuditWorkspaceView.tsx` | Add state for inline form, handler `handleAddItem`, "+" button & form UI |
| `src/components/AuditListView.tsx` | Conditional rendering of delete button per group |

### 3. Workspace — Drag-Reorder Item

- Native HTML5 drag-and-drop pada setiap item card
- Drag handle (icon) atau seluruh card bisa drag
- Saat drop, item diubah urutannya dalam array `activeCategory.items`
- Hanya aktif untuk FUNGSIONAL_ROLES, non read-only

## Non-Goals

- Tidak mengubah template
- Tidak ada modal — inline form cukup untuk 2 field
