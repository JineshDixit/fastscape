-- Rollback Migration: Enhance User Identity Documents Model
-- Date: 2026-01-22
-- Description: Remove verification_status, verification_date, verification_notes, and document_expiry_date fields

-- Step 1: Drop the trigger and function
DROP TRIGGER IF EXISTS trigger_update_verification_date ON user_identity_documents;
DROP FUNCTION IF EXISTS update_verification_date();

-- Step 2: Drop indexes
DROP INDEX IF EXISTS idx_user_documents_verification;
DROP INDEX IF EXISTS idx_user_documents_expiry;
DROP INDEX IF EXISTS idx_user_documents_verification_date;

-- Step 3: Remove new columns from user_identity_documents table
ALTER TABLE user_identity_documents 
DROP COLUMN IF EXISTS verification_status,
DROP COLUMN IF EXISTS verification_date,
DROP COLUMN IF EXISTS verification_notes,
DROP COLUMN IF EXISTS document_expiry_date;

-- Step 4: Drop the ENUM type
DROP TYPE IF EXISTS document_verification_status;