-- =============================================================================
-- SkylineLiving Migration: Update reservation_refunds schema for Multi-Stage Refund Workflow
--
-- 1. Adds requested_at DATETIME2 column to track when customer submitted refund request.
-- 2. Adds audit columns: initiated_by_role, initiated_by_user_id, initiated_by_name,
--    reviewed_by, reviewed_at, settlement_note, refund_method, transaction_reference, proof_url.
-- 3. Makes refund_amount and company_retained_amount nullable (since they are unset during PENDING_REVIEW).
-- 4. Updates refund_status CHECK constraint to include PENDING_REVIEW, PENDING_PAYMENT, APPROVED, PROCESSED, COMPLETED, PENDING.
-- 5. Adds UNIQUE constraint on reservation_id (uk_refund_res_id) if not exists.
-- 6. Backfills existing PENDING records to PENDING_REVIEW with unfinalized amounts.
-- =============================================================================

BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Make refund_amount and company_retained_amount NULLABLE
    ALTER TABLE reservation_refunds ALTER COLUMN refund_amount DECIMAL(18,2) NULL;
    ALTER TABLE reservation_refunds ALTER COLUMN company_retained_amount DECIMAL(18,2) NULL;
    PRINT 'Updated refund_amount and company_retained_amount to NULLABLE';

    -- 2. Add requested_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservation_refunds' AND COLUMN_NAME = 'requested_at'
    )
    BEGIN
        ALTER TABLE reservation_refunds ADD requested_at DATETIME2 NULL;
        PRINT 'Added requested_at column to reservation_refunds';
    END

    -- 3. Add audit columns if not exist
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservation_refunds' AND COLUMN_NAME = 'initiated_by_role'
    )
    BEGIN
        ALTER TABLE reservation_refunds ADD initiated_by_role VARCHAR(50) NULL;
        PRINT 'Added initiated_by_role column';
    END

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservation_refunds' AND COLUMN_NAME = 'initiated_by_user_id'
    )
    BEGIN
        ALTER TABLE reservation_refunds ADD initiated_by_user_id BIGINT NULL;
        PRINT 'Added initiated_by_user_id column';
    END

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservation_refunds' AND COLUMN_NAME = 'initiated_by_name'
    )
    BEGIN
        ALTER TABLE reservation_refunds ADD initiated_by_name NVARCHAR(255) NULL;
        PRINT 'Added initiated_by_name column';
    END

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservation_refunds' AND COLUMN_NAME = 'reviewed_by'
    )
    BEGIN
        ALTER TABLE reservation_refunds ADD reviewed_by NVARCHAR(255) NULL;
        PRINT 'Added reviewed_by column';
    END

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservation_refunds' AND COLUMN_NAME = 'reviewed_at'
    )
    BEGIN
        ALTER TABLE reservation_refunds ADD reviewed_at DATETIME2 NULL;
        PRINT 'Added reviewed_at column';
    END

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservation_refunds' AND COLUMN_NAME = 'settlement_note'
    )
    BEGIN
        ALTER TABLE reservation_refunds ADD settlement_note NVARCHAR(1000) NULL;
        PRINT 'Added settlement_note column';
    END

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservation_refunds' AND COLUMN_NAME = 'refund_method'
    )
    BEGIN
        ALTER TABLE reservation_refunds ADD refund_method NVARCHAR(100) NULL;
        PRINT 'Added refund_method column';
    END

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservation_refunds' AND COLUMN_NAME = 'transaction_reference'
    )
    BEGIN
        ALTER TABLE reservation_refunds ADD transaction_reference NVARCHAR(255) NULL;
        PRINT 'Added transaction_reference column';
    END

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservation_refunds' AND COLUMN_NAME = 'proof_url'
    )
    BEGIN
        ALTER TABLE reservation_refunds ADD proof_url NVARCHAR(1000) NULL;
        PRINT 'Added proof_url column';
    END

    -- 4. Drop existing refund_status check constraint and recreate with new statuses
    DECLARE @StatusConstraint NVARCHAR(256);
    SELECT @StatusConstraint = name 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('reservation_refunds') 
      AND definition LIKE '%refund_status%';

    IF @StatusConstraint IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE reservation_refunds DROP CONSTRAINT ' + @StatusConstraint);
        PRINT 'Dropped existing status constraint: ' + @StatusConstraint;
    END

    ALTER TABLE reservation_refunds ADD CONSTRAINT CK_reservation_refunds_status 
        CHECK (refund_status IN ('PENDING_REVIEW', 'PENDING_PAYMENT', 'APPROVED', 'PROCESSED', 'COMPLETED', 'PENDING'));
    PRINT 'Added CK_reservation_refunds_status constraint';

    -- 5. Add unique constraint on reservation_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = 'uk_refund_res_id' AND object_id = OBJECT_ID('reservation_refunds')
    )
    BEGIN
        ALTER TABLE reservation_refunds ADD CONSTRAINT uk_refund_res_id UNIQUE (reservation_id);
        PRINT 'Added unique constraint uk_refund_res_id on reservation_refunds(reservation_id)';
    END

    -- 6. Backfill/Clean up legacy unfinalized pending records (e.g. REF-001 / RSV-006)
    EXEC('UPDATE reservation_refunds 
    SET refund_status = ''PENDING_REVIEW'',
        refund_amount = NULL,
        company_retained_amount = NULL,
        initiated_by_role = ''CUSTOMER'',
        initiated_by_name = (SELECT name FROM users WHERE id = reservation_refunds.customer_id),
        initiated_by_user_id = customer_id
    WHERE refund_status = ''PENDING''');
    PRINT 'Migrated legacy PENDING refund records to PENDING_REVIEW';

    COMMIT TRANSACTION;
    PRINT 'reservation_refunds schema migration completed successfully.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    DECLARE @Err NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR (@Err, 16, 1);
END CATCH;
