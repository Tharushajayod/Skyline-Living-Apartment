USE SkylineLivingDB_Test;
GO

IF NOT EXISTS (
    SELECT 1 FROM roles WHERE role_name = 'ADMIN'
)
INSERT INTO roles (
    role_name,
    description,
    created_at,
    updated_at
)
VALUES (
    'ADMIN',
    'System administrator',
    SYSDATETIME(),
    SYSDATETIME()
);

IF NOT EXISTS (
    SELECT 1 FROM roles WHERE role_name = 'CUSTOMER'
)
INSERT INTO roles (
    role_name,
    description,
    created_at,
    updated_at
)
VALUES (
    'CUSTOMER',
    'Registered customer',
    SYSDATETIME(),
    SYSDATETIME()
);

IF NOT EXISTS (
    SELECT 1 FROM roles WHERE role_name = 'SALES_MANAGER'
)
INSERT INTO roles (
    role_name,
    description,
    created_at,
    updated_at
)
VALUES (
    'SALES_MANAGER',
    'Sales manager',
    SYSDATETIME(),
    SYSDATETIME()
);

IF NOT EXISTS (
    SELECT 1 FROM roles WHERE role_name = 'OPERATIONS_MANAGER'
)
INSERT INTO roles (
    role_name,
    description,
    created_at,
    updated_at
)
VALUES (
    'OPERATIONS_MANAGER',
    'Operations manager',
    SYSDATETIME(),
    SYSDATETIME()
);

IF NOT EXISTS (
    SELECT 1 FROM roles
    WHERE role_name = 'CUSTOMER_RELATIONS_OFFICER'
)
INSERT INTO roles (
    role_name,
    description,
    created_at,
    updated_at
)
VALUES (
    'CUSTOMER_RELATIONS_OFFICER',
    'Customer relations officer',
    SYSDATETIME(),
    SYSDATETIME()
);

IF NOT EXISTS (
    SELECT 1 FROM roles WHERE role_name = 'FINANCE_OFFICER'
)
INSERT INTO roles (
    role_name,
    description,
    created_at,
    updated_at
)
VALUES (
    'FINANCE_OFFICER',
    'Finance and payment officer',
    SYSDATETIME(),
    SYSDATETIME()
);

IF NOT EXISTS (
    SELECT 1 FROM roles WHERE role_name = 'MARKETING_EXECUTIVE'
)
INSERT INTO roles (
    role_name,
    description,
    created_at,
    updated_at
)
VALUES (
    'MARKETING_EXECUTIVE',
    'Marketing executive',
    SYSDATETIME(),
    SYSDATETIME()
);

IF NOT EXISTS (
    SELECT 1 FROM roles WHERE role_name = 'STAFF'
)
INSERT INTO roles (
    role_name,
    description,
    created_at,
    updated_at
)
VALUES (
    'STAFF',
    'Company staff member',
    SYSDATETIME(),
    SYSDATETIME()
);
GO