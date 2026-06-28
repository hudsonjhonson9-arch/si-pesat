# SI-PESAT Design System

## Brand Overview

SI-PESAT (Sistem Informasi Penatausahaan Kertas Kerja Audit Terintegrasi) — aplikasi pengawasan internal Inspektorat Kabupaten Sumba Barat. Tampilan profesional, hangat, dan mudah diakses.

## Color Palette

### Core Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `cream-bg` | `#FDF8F0` | Page background, login screen |
| `baby-blue` | `#BED3F3` | Section cards, filter panels, sidebar |
| `peach-accent` | `#FFD1B3` | Active indicators, badges, progress bars, accent buttons |
| `dark-gray` | `#3D4857` | Primary text, modal headers, dark buttons |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `emerald-600` | `#059669` | "Selesai" status, success indicators |
| `blue-600` | `#2563eb` | "Sedang Berjalan" status, info banners |
| `amber-600` | `#d97706` | "Direview" status, review notes |
| `rose-600` | `#e11d48` | "Temuan" status, delete actions, errors |
| `slate-500` | `#64748b` | Draft status, secondary text |

### Chart Colors

| Usage | Colors |
|-------|--------|
| Status donut | Draft `#94a3b8`, Berjalan `#3b82f6`, Direview `#f59e0b`, Selesai `#10b981` |
| Pie chart | `#f97316 #3b82f6 #10b981 #f59e0b #8b5cf6 #ef4444 #06b6d4 #ec4899` |

## Typography

- **Font Stack**: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Headings**: `font-black` (900 weight), `tracking-tight`
- **Labels/Stats**: `font-bold` (700 weight) or `font-extrabold` (800 weight), `text-[9px]`–`text-[11px]`, `uppercase tracking-wider`
- **Body**: `text-sm` (`14px`) or `text-xs` (`12px`), `text-dark-gray`
- **Monospace**: `font-mono` for NIPs, financial values, progress percentages

## Spacing

| Scale | Usage |
|-------|-------|
| `p-4 md:p-6 lg:p-8` | Page padding |
| `max-w-[1800px] mx-auto` | Content max width |
| `gap-4` | Card grids |
| `space-y-6` | Between major sections |
| `space-y-4` | Between related sections |
| `px-5 py-3` | Card headers |

## Border Radius

| Class | Value | Usage |
|-------|-------|-------|
| `rounded-3xl` | `12px` | Hero cards, large profile cards |
| `rounded-2xl` | `8px` | Content cards, modals |
| `rounded-xl` | `6px` | Section cards, buttons, inputs |
| `rounded-lg` | `4px` | Small buttons, compact cards |
| `rounded-full` | 50% | Badges, avatars, progress dots |

## Shadows

| Class | Usage |
|-------|-------|
| `shadow-xs` | Default cards, filter panels |
| `shadow-sm` | Standard cards, stat cards, tables |
| `shadow-md` | Elevated cards, FAB buttons |
| `shadow-lg` | Modals, dropdowns |
| `shadow-xl` | Toasts, login card |
| `shadow-2xl` | Full-screen modals |

## Component Library

### Cards

```
Default:     bg-white rounded-2xl border border-dark-gray/10 shadow-sm p-5
Baby-blue:   bg-baby-blue rounded-xl border border-dark-gray/10 p-4 shadow-xs
Hero:        bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg
Empty:       bg-baby-blue rounded-xl border-dashed border-dark-gray/25 p-12 text-center
Stat:        bg-white rounded-2xl p-4 border border-dark-gray/10 shadow-sm
Group Card:  bg-white rounded-2xl border border-dark-gray/15 overflow-hidden shadow-sm
```

### Buttons

```
Dark Primary:   bg-dark-gray text-white rounded-xl font-extrabold text-xs px-4 py-2
Peach Primary:  bg-peach-accent text-dark-gray rounded-xl font-extrabold text-xs px-4 py-2
Secondary:      bg-white text-dark-gray border border-dark-gray/15 rounded-xl font-bold text-xs
Danger:         bg-rose-50 text-rose-600 border border-rose-100 rounded-xl
```

### Inputs

```
Text:     w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg
          bg-white/70 focus:bg-white focus:ring-2 focus:ring-peach-accent/30
Select:   w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white
Label:    text-[10px] font-bold text-dark-gray/70 uppercase tracking-wider
```

### Badges

| Status | Classes |
|--------|---------|
| Selesai | `bg-emerald-100 text-emerald-800 border-emerald-200` |
| Sedang Berjalan | `bg-blue-100 text-blue-800 border-blue-200` |
| Direview | `bg-amber-100 text-amber-800 border-amber-200` |
| Draft | `bg-slate-100 text-slate-500 border-slate-200` |
| Counter | `bg-peach-accent/20 px-3 py-1 rounded-full text-[10px] font-black` |

### Modals

```
Overlay:  fixed inset-0 bg-black/55 backdrop-blur-xs z-50
Modal:    bg-white rounded-2xl shadow-2xl border border-dark-gray/10 w-full max-w-sm
Header:   bg-dark-gray text-white px-5 py-4 rounded-t-2xl
```

### Status Toggles

```
Active:   bg-{color}-600 text-white shadow-md scale-105
Inactive: bg-{color}-50 text-{color}-700/70 border border-{color}-200/50
Colors:   emerald (Sesuai), rose (Temuan), slate (N/A)
```

### Animate

```
animate-fade-in     — Page/component entry
animate-slide-up    — Detail form expansion
animate-bounce      — Finding alert icon
animate-pulse       — Running status indicators
animate-spin        — Loading spinners
```

## Layout

```
Page:     p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto
Sidebar:  w-[280px] shrink-0 hidden lg:flex
Navbar:   bg-dark-gray text-white px-4 md:px-8 py-3
Footer:   bg-white border-t border-dark-gray/10 shadow-lg px-4 py-3
Grid:     grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
```

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| `default` | < 768px | Mobile: single column, bottom nav, slide-in drawers |
| `md` | ≥ 768px | Tablet: 2-column grids, sidebar nav appears |
| `lg` | ≥ 1024px | Desktop: 3-column grids, full sidebar |
