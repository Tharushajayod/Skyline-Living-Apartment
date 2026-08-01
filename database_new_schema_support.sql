USE SkylineLivingDB_Test;
GO

-- JPA inserts into user_roles need a value for assigned_at.
IF NOT EXISTS (
    SELECT 1 FROM sys.default_constraints dc
    JOIN sys.columns c ON c.default_object_id = dc.object_id
    JOIN sys.tables t ON t.object_id = c.object_id
    WHERE t.name='user_roles' AND c.name='assigned_at'
)
BEGIN
    ALTER TABLE dbo.user_roles
    ADD CONSTRAINT DF_user_roles_assigned_at DEFAULT (SYSDATETIME()) FOR assigned_at;
END;
GO

-- Seed the roles used by the current backend.
DECLARE @now datetime2 = SYSDATETIME();
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE role_name='CUSTOMER')
 INSERT INTO dbo.roles(role_name,description,created_at,updated_at) VALUES('CUSTOMER','Customer user',@now,@now);
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE role_name='ADMIN')
 INSERT INTO dbo.roles(role_name,description,created_at,updated_at) VALUES('ADMIN','System administrator',@now,@now);
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE role_name='STAFF')
 INSERT INTO dbo.roles(role_name,description,created_at,updated_at) VALUES('STAFF','Company staff member',@now,@now);
GO
