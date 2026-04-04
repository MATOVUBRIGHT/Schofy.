# Multi-Tenant Offline-First Sync System

## Overview

Schofy now supports multi-tenant synchronization with Supabase as the central cloud database. Each school operates independently with local-first data storage and automatic cloud synchronization.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SCHOFY MULTI-TENANT ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐  │
│   │  School A  │         │  School B   │         │  School C   │  │
│   │  (Local)   │         │  (Local)   │         │  (Local)   │  │
│   └──────┬─────┘         └──────┬─────┘         └──────┬─────┘  │
│          │                       │                       │          │
│          │ IndexedDB             │ IndexedDB             │ IndexedDB│
│          │                       │                       │          │
│          ▼                       ▼                       ▼          │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    SYNC ENGINE                               │   │
│   │  - Queues changes locally                                    │   │
│   │  - Handles conflict resolution                               │   │
│   │  - Auto-sync when online                                    │   │
│   │  - Backup/restore functionality                             │   │
│   └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                       │
│                              │ HTTPS / REST                          │
│                              ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    SUPABASE                                  │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │
│   │  │  Schools    │  │  Students   │  │  Staff      │        │   │
│   │  │  (RLS)     │  │  (RLS)     │  │  (RLS)      │        │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘        │   │
│   │                                                              │   │
│   │  • Row Level Security (RLS) isolates each school              │   │
│   │  • Realtime subscriptions for live updates                   │   │
│   │  • Central backup and recovery                               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Offline-First
- All data stored locally in IndexedDB
- App works fully offline
- Changes queued locally until sync
- No data loss on network issues

### 2. Multi-Tenant
- Each school has unique `school_id`
- Row Level Security (RLS) isolates data
- Schools cannot access each other's data
- Central management dashboard ready

### 3. Sync Engine
- **Push**: Local → Supabase (when online)
- **Pull**: Supabase → Local (updates from other devices)
- **Conflict Resolution**: Configurable (last write wins, local wins, remote wins, manual)
- **Retry Logic**: Automatic retry with exponential backoff

### 4. Backup & Restore
- Export full database to JSON
- Import backup from file
- School-specific backups
- Version control for backups

## Database Schema

### Local (IndexedDB via Dexie)
All tables include:
- `id`: UUID primary key
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `deletedAt`: Soft delete timestamp
- `syncStatus`: 'pending' | 'synced' | 'failed'

### Cloud (Supabase PostgreSQL)
All tables include:
- `id`: UUID primary key
- `school_id`: Tenant identifier
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `deleted_at`: Soft delete timestamp

## Sync Tables

The following tables are synchronized:
1. students
2. staff
3. classes
4. subjects
5. attendance
6. fees
7. feeStructures
8. bursaries
9. discounts
10. payments
11. announcements
12. notifications
13. salaryPayments
14. exams
15. examResults
16. timetable
17. transportRoutes
18. transportAssignments

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public Key (found in Settings → API)
   - Service Role Key (for admin operations)

### 2. Run Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Copy contents from `supabase/schema.sql`
3. Run the SQL to create all tables and RLS policies

### 3. Configure App

In Settings page:
1. Enable Cloud Sync
2. Enter Supabase URL
3. Enter Supabase Anon Key
4. Configure sync options:
   - Auto-sync interval (1-60 minutes)
   - Conflict resolution strategy
   - Sync on startup (yes/no)
   - Sync on reconnect (yes/no)

### 4. Test Connection

Click "Test Connection" to verify:
- Supabase URL is valid
- API key works
- RLS policies are in place

## Conflict Resolution Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `last_write_wins` | Most recent change wins | Default, best for most cases |
| `local_wins` | Local changes always win | Offline-heavy workflows |
| `remote_wins` | Cloud changes always win | Centralized management |
| `manual` | User decides each conflict | Critical data requiring human review |

## API Endpoints

### Sync Operations

```sql
-- Get changes since timestamp
SELECT * FROM get_table_changes(school_uuid, table_name, since_timestamp);

-- Get deleted records
SELECT * FROM get_deleted_records(school_uuid, table_name, since_timestamp);

-- Bulk upsert
SELECT * FROM bulk_upsert(school_uuid, table_name, records_json, operation);
```

## Security

### Row Level Security (RLS)
- Every table has RLS enabled
- Users can only access their school's data
- school_id is automatically filtered
- Admin operations require additional checks

### Authentication
- Supabase Auth for user management
- JWT tokens for API access
- Role-based access (admin, teacher, accountant, parent)

## Files Structure

```
client/src/
├── db/
│   ├── database.ts      # IndexedDB schema (Dexie)
│   └── schema.ts       # TypeScript interfaces
├── contexts/
│   └── SyncContext.tsx # React sync provider
└── services/
    └── sync.ts         # Sync engine

supabase/
└── schema.sql         # PostgreSQL schema with RLS
```

## Usage

### Enable Sync in App
1. Go to Settings → Cloud Sync
2. Toggle "Enable Cloud Sync"
3. Enter Supabase credentials
4. Save and test connection

### Manual Sync
- Click sync icon in header
- Status shows: Synced, Syncing, Pending, Offline

### Export Backup
1. Go to Settings → Backup
2. Click "Export Backup"
3. Save JSON file securely

### Import Backup
1. Go to Settings → Backup
2. Click "Import Backup"
3. Select backup JSON file
4. Confirm import

## Troubleshooting

### Sync Not Working
1. Check internet connection
2. Verify Supabase credentials
3. Check RLS policies in Supabase
4. View browser console for errors

### Conflicts
1. Check Sync Logs in Settings
2. Identify conflicting records
3. Choose resolution strategy
4. Manual resolution for critical conflicts

### Data Loss Prevention
1. Regular backups (export)
2. Soft deletes (no permanent deletion)
3. Sync queue for failed operations
4. Recycle bin for deleted items

## Future Enhancements

- [ ] Realtime subscriptions (live updates)
- [ ] Selective sync (choose tables)
- [ ] Delta sync (only changed fields)
- [ ] Compression before sync
- [ ] End-to-end encryption
- [ ] Multi-device conflict UI
