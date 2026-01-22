DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'AWAITING_APPROVAL' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'requeststatus')) THEN
        ALTER TYPE requeststatus ADD VALUE 'AWAITING_APPROVAL';
    END IF;
END
$$;
