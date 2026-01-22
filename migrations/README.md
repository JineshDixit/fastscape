# Database Migrations

## Enhanced User Identity Documents Migration

This migration enhances the `user_identity_documents` table to support better document tracking and verification.

### Changes Made

1. **New Fields Added:**
   - `verification_status` (ENUM): Current verification status ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')
   - `verification_date` (TIMESTAMP): Date when document was verified
   - `verification_notes` (TEXT): Notes from verification process
   - `document_expiry_date` (DATE): Document expiry date if applicable

2. **Indexes Created:**
   - `idx_user_documents_verification`: Composite index on (user_id, verification_status)
   - `idx_user_documents_expiry`: Index on document_expiry_date (partial index)
   - `idx_user_documents_verification_date`: Index on verification_date (partial index)

3. **Automatic Triggers:**
   - Auto-updates `verification_date` when status changes to 'VERIFIED'

### How to Run Migration

#### Option 1: Using psql command line
```bash
# Connect to your database
psql -h localhost -U your_username -d your_database_name

# Run the migration
\i migrations/enhance_user_identity_documents.sql
```

#### Option 2: Using database client (pgAdmin, DBeaver, etc.)
1. Open your database client
2. Connect to your database
3. Open and execute the contents of `enhance_user_identity_documents.sql`

#### Option 3: Using Node.js script
```javascript
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  // your database configuration
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync('./migrations/enhance_user_identity_documents.sql', 'utf8');
    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
  }
}

runMigration();
```

### How to Rollback

If you need to rollback the migration:

```bash
# Using psql
psql -h localhost -U your_username -d your_database_name
\i migrations/rollback_enhance_user_identity_documents.sql
```

### Verification

After running the migration, verify the changes:

```sql
-- Check table structure
\d user_identity_documents

-- Check indexes
\di user_identity_documents*

-- Check ENUM type
\dT+ document_verification_status

-- Test the trigger
UPDATE user_identity_documents 
SET verification_status = 'VERIFIED' 
WHERE id = 'some-test-id';

-- Verify verification_date was set automatically
SELECT id, verification_status, verification_date 
FROM user_identity_documents 
WHERE id = 'some-test-id';
```

### Notes

- The migration preserves existing data
- Existing records with `verified = true` are automatically updated to `verification_status = 'VERIFIED'`
- The `verified` column is kept for backward compatibility
- All new fields are nullable except `verification_status` which defaults to 'PENDING'