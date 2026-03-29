-- 008_add_prepaid_balance.sql
-- Adds prepaid balance support to khata system

-- Add prepaid_balance column to khata_students
ALTER TABLE khata_students 
ADD COLUMN IF NOT EXISTS prepaid_balance numeric(10,2) DEFAULT 0 NOT NULL;

-- Modify entry_type to support 'credit' (prepaid top-up) and 'debit' (purchase/expense)
-- Existing entries are 'debit' by default (postpaid purchases)
ALTER TABLE khata_entries 
ALTER COLUMN entry_type DROP DEFAULT;

-- Update existing entries to use 'debit' (they are all expenses/purchases)
UPDATE khata_entries 
SET entry_type = 'debit' 
WHERE entry_type IN ('daily', 'monthly');

-- Drop existing constraint if it exists
ALTER TABLE khata_entries 
DROP CONSTRAINT IF EXISTS khata_entries_entry_type_check;

-- Add constraint to ensure entry_type is valid
ALTER TABLE khata_entries 
ADD CONSTRAINT khata_entries_entry_type_check 
CHECK (entry_type IN ('debit', 'credit'));

-- Add default back for new entries
ALTER TABLE khata_entries 
ALTER COLUMN entry_type SET DEFAULT 'debit';

-- Add balance_after column to track running balance after each transaction
ALTER TABLE khata_entries 
ADD COLUMN IF NOT EXISTS balance_after numeric(10,2);

-- Comments for clarity
COMMENT ON COLUMN khata_students.prepaid_balance IS 'Current prepaid balance available for the student';
COMMENT ON COLUMN khata_entries.entry_type IS 'Transaction type: credit (prepaid top-up) or debit (purchase/expense)';
COMMENT ON COLUMN khata_entries.balance_after IS 'Prepaid balance after this transaction';
COMMENT ON COLUMN khata_entries.amount IS 'Transaction amount: positive for credits, positive for debits (stored as positive, type determines operation)';
