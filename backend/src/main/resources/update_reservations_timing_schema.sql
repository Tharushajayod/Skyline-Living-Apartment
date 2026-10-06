-- =============================================================================
-- SkylineLiving Migration: Update reservations schema for Authoritative Timing Logic
--
-- Business Rules:
-- 1. reservation_fee_confirmed_at: The authoritative timestamp when reservation fee
--    was successfully paid and verified.
-- 2. expires_at (4-Day Hold): reservation_fee_confirmed_at + 4 days (NULL before fee confirmation).
-- 3. cancellation_deadline (48-Hour Window): reservation_fee_confirmed_at + 48 hours (NULL before fee confirmation).
-- =============================================================================

BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Make expires_at column NULLABLE (since pending reservations do NOT have hold countdown)
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservations' AND COLUMN_NAME = 'expiresAt' AND IS_NULLABLE = 'NO'
    )
    BEGIN
        ALTER TABLE reservations ALTER COLUMN expiresAt DATETIME2 NULL;
        PRINT 'Updated expiresAt to NULLABLE';
    END

    -- 2. Add reservation_fee_confirmed_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservations' AND COLUMN_NAME = 'reservation_fee_confirmed_at'
    )
    BEGIN
        ALTER TABLE reservations ADD reservation_fee_confirmed_at DATETIME2 NULL;
        PRINT 'Added reservation_fee_confirmed_at column to reservations';
    END

    -- 3. Add cancellation_deadline column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'reservations' AND COLUMN_NAME = 'cancellation_deadline'
    )
    BEGIN
        ALTER TABLE reservations ADD cancellation_deadline DATETIME2 NULL;
        PRINT 'Added cancellation_deadline column to reservations';
    END

    -- 4. Create indexes if not exists
    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = 'idx_res_fee_confirmed_at' AND object_id = OBJECT_ID('reservations')
    )
    BEGIN
        CREATE INDEX idx_res_fee_confirmed_at ON reservations(reservation_fee_confirmed_at);
        PRINT 'Created index idx_res_fee_confirmed_at';
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes 
        WHERE name = 'idx_res_cancel_deadline' AND object_id = OBJECT_ID('reservations')
    )
    BEGIN
        CREATE INDEX idx_res_cancel_deadline ON reservations(cancellation_deadline);
        PRINT 'Created index idx_res_cancel_deadline';
    END

    -- 5. Safe Backfill for existing CONFIRMED reservations with verified payments:
    -- Derive reservation_fee_confirmed_at strictly from the verified payment timestamp
    UPDATE r
    SET r.reservation_fee_confirmed_at = COALESCE(p.verified_at, p.uploaded_at),
        r.expires_at = DATEADD(DAY, 4, COALESCE(p.verified_at, p.uploaded_at)),
        r.cancellation_deadline = DATEADD(HOUR, 48, COALESCE(p.verified_at, p.uploaded_at))
    FROM reservations r
    INNER JOIN payments p ON p.reservation_id = r.id AND p.type = 'RESERVATION_FEE' AND p.status = 'VERIFIED'
    WHERE r.reservation_fee_confirmed_at IS NULL AND COALESCE(p.verified_at, p.uploaded_at) IS NOT NULL;
    PRINT 'Backfilled existing confirmed reservations from verified reservation payments';

    -- 6. For PENDING reservations, reset expires_at to NULL so no misleading 4-day countdown shows
    UPDATE r
    SET r.expires_at = NULL,
        r.cancellation_deadline = NULL
    FROM reservations r
    WHERE r.status = 'PENDING' AND r.reservation_fee_confirmed_at IS NULL;
    PRINT 'Cleaned up misleading pending reservation expires_at timestamps';

    COMMIT TRANSACTION;
    PRINT 'Reservations timing migration completed successfully.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
