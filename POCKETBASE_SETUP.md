# PocketBase Setup Guide

## Installation

1. Download PocketBase from https://pocketbase.io/docs/
2. Extract and run PocketBase:
   ```bash
   ./pocketbase serve
   ```
3. Access admin UI at http://127.0.0.1:8090/_/

## Database Collections

### 1. Collection: `students`
- **name** (Text) - required
- **pin** (Text) - required, exactly 4 digits
- **balance** (Number) - default: 0
- **allergies** (Text) - optional
- **parent_id** (Relation to users) - required

**Indexes:**
- Create index on `pin` for faster lookups

### 2. Collection: `transactions`
- **parent_id** (Relation to users) - required
- **amount** (Number) - required
- **date** (Date) - required, default: @now

### 3. Collection: `daily_logs`
- **student_id** (Relation to students) - required, cascade delete
- **date** (Date) - required
- **status** (Select: eaten) - required

**Indexes:**
- Create index on `date` for performance
- Create compound index on `student_id, date`

## API Rules (Important!)

For development, you can set all collections to:
- **List/View**: `@request.auth.id != ""`
- **Create/Update/Delete**: `@request.auth.id != ""`

For the kiosk to work without auth:
- **students** collection:
  - List/View: Allow anyone (empty rule)
  - Update: `@request.auth.id != "" || @request.data.balance:isset`

- **daily_logs** collection:
  - Create: Allow anyone (empty rule)

## Seed Data (Optional)

Create a few test students via Admin UI:
```
Name: יוסי כהן
PIN: 1234
Balance: 20
Parent: <select a user>

Name: שרה לוי
PIN: 5678
Balance: 15
Parent: <select a user>
```

## Connection

The app connects to PocketBase at `http://127.0.0.1:8090`

Update `src/lib/pocketbase.ts` if using a different URL.
