-- Migration: Enhance User Identity Documents Model
-- Date: 2026-01-22
-- Description: Add verification_status, verification_date, verification_notes, and document_expiry_date fields

-- Step 1: Create ENUM type for document verification status
CREATE TYPE document_verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- Step 2: Add new columns to user_identity_documents table
ALTER TABLE user_identity_documents 
ADD COLUMN verification_status document_verification_status DEFAULT 'PENDING' NOT NULL,
ADD COLUMN verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN verification_notes TEXT,
ADD COLUMN document_expiry_date DATE;

-- Step 3: Create indexes for better query performance
CREATE INDEX idx_user_documents_verification ON user_identity_documents(user_id, verification_status);
CREATE INDEX idx_user_documents_expiry ON user_identity_documents(document_expiry_date) WHERE document_expiry_date IS NOT NULL;
CREATE INDEX idx_user_documents_verification_date ON user_identity_documents(verification_date) WHERE verification_date IS NOT NULL;

-- Step 4: Update existing records to have consistent verification status
-- Set verification_status to 'VERIFIED' where verified = true
UPDATE user_identity_documents 
SET verification_status = 'VERIFIED', 
    verification_date = updated_at 
WHERE verified = true;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN user_identity_documents.verification_status IS 'Current verification status of the document';
COMMENT ON COLUMN user_identity_documents.verification_date IS 'Date when the document was verified';
COMMENT ON COLUMN user_identity_documents.verification_notes IS 'Notes from the verification process';
COMMENT ON COLUMN user_identity_documents.document_expiry_date IS 'Expiry date of the document if applicable';

-- Step 6: Create a function to automatically update verification_date when status changes to VERIFIED
CREATE OR REPLACE FUNCTION update_verification_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_status = 'VERIFIED' AND OLD.verification_status != 'VERIFIED' THEN
        NEW.verification_date = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to automatically update verification_date
CREATE TRIGGER trigger_update_verification_date
    BEFORE UPDATE ON user_identity_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_date();