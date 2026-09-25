-- =============================================================================
-- SkylineLiving Safe Development / Test Data Cleanup Script
-- Target Database: Microsoft SQL Server (skyline_living)
--
-- This script cleans up all transactional, test, and operational records
-- while preserving all Master / Base data (users, apartments, apartment_images,
-- and apartment_facilities).
--
-- Foreign Key Dependency Order for Deletion:
--  1. payments            (references payment_plan_items.id, payment_plans.id, reservations.id)
--  2. payment_plan_items  (references payment_plans.id)
--  3. payment_plans       (references reservations.id)
--  4. sales               (references reservations.id)
--  5. reservations        (references apartments.id, users.id)
--  6. appointments        (references apartments.id, users.id)
--  7. inquiry_replies     (references inquiries.id)
--  8. inquiries           (references apartments.id, users.id)
--  9. reviews             (references apartments.id, users.id)
-- 10. notifications       (references users.id)
-- 11. favorites           (references apartments.id, users.id)
-- =============================================================================

BEGIN TRANSACTION;

BEGIN TRY
    -- 1. Remove all payments (must precede payment_plan_items, payment_plans, reservations)
    DELETE FROM payments;

    -- 3. Remove payment plan items (must precede payment_plans)
    DELETE FROM payment_plan_items;

    -- 4. Remove payment plans (must precede reservations)
    DELETE FROM payment_plans;

    -- 5. Remove sales (must precede reservations)
    DELETE FROM sales;

    -- 6. Remove reservations
    DELETE FROM reservations;

    -- 7. Remove viewing appointments
    DELETE FROM appointments;

    -- 8. Remove inquiry replies (must precede inquiries)
    DELETE FROM inquiry_replies;

    -- 9. Remove customer inquiries
    DELETE FROM inquiries;

    -- 10. Remove customer reviews
    DELETE FROM reviews;

    -- 11. Remove system notifications
    DELETE FROM notifications;

    -- 12. Reset all apartments back to AVAILABLE status
    UPDATE apartments 
    SET status = 'AVAILABLE' 
    WHERE status IN ('RESERVED', 'SOLD');

    COMMIT TRANSACTION;
    PRINT 'SkylineLiving transactional data cleaned successfully. Master data preserved.';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
