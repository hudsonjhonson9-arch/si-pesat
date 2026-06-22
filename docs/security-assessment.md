# Security Assessment — SI-PESAT

**Date:** 2026-06-22
**Version:** 1.0

## Overview

Security assessment for SI-PESAT (Sistem Informasi Penatausahaan Kertas Kerja Audit Terintegrasi), a React + Supabase audit management application for the Inspectorate of West Sumba Regency.

## Critical Vulnerabilities Fixed

### 1. Row Level Security (RLS)

| Status | Detail |
|--------|--------|
| ✅ **Fixed** | RLS enabled on all 8 tables |

**Policies implemented:**
- **profiles** — users read/update their own, admin read/update all
- **audits** — creator/team/admin access, others blocked
- **templates** — authenticated read, admin write
- **target_entities** — authenticated read, admin write
- **roles / permissions / role_permissions / bidang** — authenticated read, admin write

### 2. Google Apps Script Authentication

| Status | Detail |
|--------|--------|
| ✅ **Fixed** | JWT token verification via Supabase Auth API |

- All requests must include `Authorization: Bearer <supabase_jwt>`
- Tokens verified against `SUPABASE_URL/auth/v1/user`
- User identity (email + ID) recorded in Drive file description
- Unauthorized requests return 401

### 3. Client-Side Access Control

| Status | Detail |
|--------|--------|
| ✅ **Fixed** | All auth state now comes from Supabase session |

- Removed all `localStorage` reads/writes for `is_admin`, `user_role`, `session_active`
- Removed offline login bypass (`handleSessionLogin`)
- Role/permissions fetched from Supabase `profiles` table on every login

### 4. Login Flow

| Status | Detail |
|--------|--------|
| ✅ **Fixed** | Role check before dashboard access |

- Loading spinner persists until profile role is confirmed
- Button text changed from "Masuk Sesi" to "Masuk"

## Current Security Posture

### ✅ Protected
- **RLS** — all 8 tables have RLS policies
- **Authentication** — Supabase Auth (email/password + MFA)
- **File Upload** — JWT-verified, user identity logged
- **Authorization** — server-enforced via RLS, not client-only

### ⚠️ Medium (Melanjutkan)
- **Password policy** — minimum 8 chars, no complexity requirement
- **Rate limiting** — relies on Supabase default, no custom throttle
- **Leaked password protection** — disabled (enable via Supabase dashboard: Authentication > Settings > Bot Protection)

### ℹ️ Informational
- **Supabase anon key** exposed in client — this is by design for Supabase SPAs. Security relies on RLS (now active).
- **Google Drive files** set to `ANYONE_WITH_LINK` — needed for preview. Files are inside a centralized Drive folder controlled by Inspectorate.

## Recommended Next Steps

1. **Enable Leaked Password Protection** — Supabase dashboard > Authentication > Settings > Bot Protection
2. **Add password complexity** — require uppercase + number + special char
3. **Rate limiting** — add custom rate limiting for login attempts
4. **File size validation** — add server-side file size/type check in Google Apps Script
5. **CSP Headers** — add Content-Security-Policy via deployment platform (Vercel/Netlify)
