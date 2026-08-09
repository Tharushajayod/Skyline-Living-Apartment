# Database Setup and Maintenance

## Files
```text
database/
├── 01_schema.sql
├── 02_seed_roles.sql
├── 03_optional_test_data.sql
└── README.md
```

Run scripts in order.

## Main Database
```text
SkylineLivingDB_Test
```

## Role Names
```text
ADMIN
CUSTOMER
SALES_MANAGER
OPERATIONS_MANAGER
CUSTOMER_RELATIONS_OFFICER
FINANCE_OFFICER
MARKETING_EXECUTIVE
STAFF
```

## Database Change Rules
1. Check the ER diagram.
2. Check existing entities.
3. Inform the group when shared tables are affected.
4. Update Java entities.
5. Update SQL scripts.
6. Run with `spring.jpa.hibernate.ddl-auto=validate`.
7. Test existing modules.

## Recommended Migrations
```text
database/migrations/
├── V001__initial_schema.sql
├── V002__add_payment_evidence.sql
├── V003__add_profile_image_url.sql
└── V004__update_role_names.sql
```

After a migration has been shared, add a new migration instead of rewriting the old one.

## Export Current Schema
In SSMS:
1. Right-click the database.
2. Select `Tasks`.
3. Select `Generate Scripts`.
4. Select database objects.
5. Open `Advanced`.
6. Select `Schema only`.
7. Save and review the SQL file.

Do not include real passwords, customer information, payment information, database credentials, or JWT secrets in test data.