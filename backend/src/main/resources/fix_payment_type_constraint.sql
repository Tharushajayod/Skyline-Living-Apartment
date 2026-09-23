-- =============================================================================
-- SkylineLiving Migration: Update payments.type CHECK constraint
--
-- Drops the restrictive check constraint on payments.type (which only allowed
-- FULL_PAYMENT, INSTALLMENT, RESERVATION_FEE) and replaces it
-- with an updated constraint that also allows INSTALLMENT_PAYMENT and PART_PAYMENT.
-- =============================================================================

BEGIN TRANSACTION;

BEGIN TRY
    DECLARE @ConstraintName NVARCHAR(256);

    SELECT @ConstraintName = name 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('payments') 
      AND definition LIKE '%type%';

    IF @ConstraintName IS NOT NULL
    BEGIN
        PRINT 'Dropping existing constraint: ' + @ConstraintName;
        EXEC('ALTER TABLE payments DROP CONSTRAINT ' + @ConstraintName);
    END;

    PRINT 'Adding updated constraint CK_payments_type...';
    ALTER TABLE payments ADD CONSTRAINT CK_payments_type 
        CHECK (type IN ('FULL_PAYMENT', 'INSTALLMENT', 'RESERVATION_FEE', 'INSTALLMENT_PAYMENT', 'PART_PAYMENT'));

    COMMIT TRANSACTION;
    PRINT 'payments.type check constraint updated successfully.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
