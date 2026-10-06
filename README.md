# Skyline Living — Apartment Sales & Management Portal

Skyline Living is a full-stack web application for browsing apartments, arranging appointments, requesting reservations, recording payments, managing purchases, and maintaining sales and ownership records. It provides customer and management workflows with role-based access.

> **Documentation verification status:** This README was prepared from supplied project information and reservation-management source excerpts. The repository was inaccessible during preparation, so this is a detailed documentation draft rather than a complete source-code audit. Features below describe the documented project scope and agreed business rules; they are not a claim that every recent fix has been implemented. Verify directory names, configuration keys, database initialization, account provisioning, API paths, and enabled integrations against your current checkout before distributing this as the final repository README.

## Contents

- [Technology stack](#technology-stack)
- [Roles and features](#roles-and-features)
- [Business rules](#business-rules)
- [Architecture](#architecture)
- [Install on a new laptop](#install-on-a-new-laptop)
- [Database setup and consistency](#database-setup-and-consistency)
- [Run the application](#run-the-application)
- [First-use walkthrough](#first-use-walkthrough)
- [Build and tests](#build-and-tests)
- [Troubleshooting](#troubleshooting)
- [Security and operational notes](#security-and-operational-notes)
- [Documentation and contribution](#documentation-and-contribution)
- [Maintainer verification checklist](#maintainer-verification-checklist)

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Spring Boot 3.5, Java 17 |
| Authentication | Spring Security and JWT |
| Persistence | Spring Data JPA / Hibernate |
| Database context | Microsoft SQL Server, administered using SSMS |
| Backend build | Maven; use the Maven Wrapper where supplied |
| Frontend packages | npm; use the committed lockfile |

The exact frontend dependency versions and supported Node.js version must be checked in `package.json`, the lockfile, and any Node version file. SQL Server edition/version and JDBC settings must match the current backend configuration.

## Roles and features

### Visitors and customers

| Area | Documented functionality |
|---|---|
| Apartment catalogue | Browse listings and open apartment details, including apartment characteristics, price, and availability. |
| Accounts | Authenticate through the existing account system and access customer-specific pages. Verify registration and account recovery routes in the current source. |
| Customer dashboard | View relevant reservation, appointment, purchase, and payment information. |
| Appointments | Request and track appointments; maintain rescheduling history where the workflow supports it. |
| Reservations | Request an apartment reservation, view fee status, and track a confirmed hold. |
| Time windows | Display the four-day hold and 48-hour cancellation window separately. |
| Cancellation | Submit an eligible cancellation request for management review. |
| Payments | View reservation fees, purchase payments, installments, cancellation information, and refunds. |
| Refund tracking | View refund progress and release information; customer acknowledgement/notification support must be verified in the current implementation. |
| Purchase plans | Follow full-payment or installment/part-payment purchase workflows. |
| Buyer listing visibility | A sold apartment should remain visible to its buyer while being excluded from public and other-customer listings. |
| Sign out | Confirm sign out in a dialog before ending the session. |

### Administrators and staff

Actions must follow the actual role permissions enforced by the backend. This table does not imply that staff have every administrator privilege.

| Area | Documented functionality |
|---|---|
| Management dashboard | View operational summaries and financial indicators. |
| Apartment management | Create and edit apartment records and listing details. |
| Form validation | Numeric validation for floor, bedrooms, bathrooms, and size; tab-level validation feedback. |
| Construction year | Select a year from 1980 through the current year. |
| Availability | Derive apartment status from reservation, expiry, cancellation, and completed-sale workflows. |
| Appointments | Manage customer appointments and rescheduling records. |
| Reservations | Review awaiting-fee, confirmed, expired, cancelled, and committed reservation states where supported. |
| Payment confirmation | Confirm reservation-fee receipts and manage purchase payment records. |
| Cancellation review | Approve/reject customer cancellation requests and record the applicable refund amount. |
| Refund management | Record refund release and customer communication without requiring a payment gateway. |
| Sales and records | Maintain full contract/sale values and ownership-related records. |
| Installment plans | Manage installment/part-payment arrangements and individual payment items. |
| Monthly income | Report actual monthly cash receipts and refunds separately from full sale values. |
| Notifications | Communicate relevant lifecycle updates; verify email provider setup and the implemented notification channels. |

## Business rules

These are the agreed target rules. Confirm that the current backend implements them; documentation does not enforce them.

### Reservation fee and four-day hold

1. Creating a reservation request does not start the paid four-day hold.
2. The hold starts only when the reservation fee is paid and confirmed.
3. The authoritative fee-confirmation timestamp determines both deadlines:

```text
holdExpiresAt = feeConfirmedAt + 96 hours
cancellationDeadline = feeConfirmedAt + 48 hours
```

`feeConfirmedAt` is a conceptual name in this README. Use the actual persisted field exposed by the project. Do not assume that `createdAt` is a payment-confirmation timestamp.

Before confirmation, show an awaiting-fee state rather than a hold countdown. Confirmation retries must not restart the timers. Any separate unpaid-request timeout must remain distinct from the paid hold.

Example: a request submitted on October 1 at 10:00 and confirmed on October 2 at 15:00 has a cancellation deadline of October 4 at 15:00 and a hold expiry of October 6 at 15:00.

### Cancellation and refunds

- The documented cancellation window is 48 hours from fee confirmation for customer/admin cancellation paths governed by this policy. Verify any separately authorized management override in code.
- Customer cancellation requests require administrator/staff confirmation; submitting a request must not automatically release a refund.
- Management can configure a customer-requested refund amount, including a partial refund.
- Management-initiated cancellation requires recording a full reservation-fee refund.
- Refund records should distinguish approval, release confirmation, and customer communication/acknowledgement where implemented.
- Cancellation and refund information should both remain visible in payment history.
- Re-reserving the same apartment after cancellation/refund requires a fresh reservation fee. A previous fee must not carry over.
- The backend enforces deadline eligibility. Browser countdowns only display the timing.
- Cancelled/refunded records stop displaying live countdowns.

### Expiry and availability

- Expiration of the 48-hour cancellation window does not end the four-day reservation hold.
- A paid hold expires using its fee-confirmation deadline.
- Cancellation/expiry releases the apartment to Available when no other valid active reservation or completed sale prevents release.
- New apartments default to Available. Later availability changes follow the business workflow rather than unrestricted manual status selection.
- Completed purchases display an appropriate completed/finalized status, not `CANCELLED • CLOSED`.

### Sales, income, and installments

| Metric | Intended treatment |
|---|---|
| Sales & Records | Record the full apartment sale/contract value, including installment purchases. |
| Monthly cash receipts | Count only amounts actually received during that month. |
| Installment income | Count the installment amount received, not the entire apartment price. |
| Released refunds | Deduct the actual refund outflow in the applicable reporting period. |
| Held reservation fees | Display held amounts separately; do not silently treat them as earned sales income. |
| Net monthly cash movement | Receipts minus released refunds, using consistent reporting dates and status filters. |

Define whether receipts include held fees in the actual report labels and calculations. Do not deduct a hold twice or count a pending refund as already released. Link payments, refunds, and reservations to prevent duplicate totals. Installment counts are specified as 2–60; verify the current validation and meaning of any separate installment-fee field.

## Architecture

```text
React frontend → HTTP API → Spring Security/JWT → Controllers/services
                                                      ↓
                                            JPA repositories → SQL Server
```

Frontend areas observed in supplied source/context include `src/client`, `src/management`, and `src/shared`. Shared modules include contexts, services, UI components, types, and formatting utilities. Confirm their parent directory in the actual repository.

The backend follows controller/service/repository/entity patterns. The project also contains academically relevant Factory, Strategy, Observer, and Decorator implementations. Preserve their intended roles when refactoring.

Key domain concepts include apartments, users, appointments, appointment rescheduling, reservations, payments, payment plans/items, reservation refunds, sales, and ownership records. This is a domain overview, not an exhaustive entity or schema inventory.

## Install on a new laptop

### 1. Install prerequisites

Install:

- Git.
- JDK 17, with `JAVA_HOME` pointing to the JDK directory.
- A Node.js version supported by the repository, with npm.
- SQL Server Database Engine, or access to the project's configured remote SQL Server.
- SSMS for SQL Server administration. **SSMS alone does not install the database engine.**
- Maven only if the repository does not include a working wrapper.
- An editor such as VS Code or IntelliJ IDEA.

Open a new PowerShell window after installation:

```powershell
git --version
java -version
javac -version
node --version
npm --version
```

All commands must resolve. Check the editor's terminal too, because an editor opened before installation can retain an older PATH.

### 2. Clone the project

```powershell
git clone https://github.com/Tharushajayod/Skyline-Living-Apartment.git
cd Skyline-Living-Apartment
Get-ChildItem
```

If the repository is private, use a GitHub account with access and your normal credential manager. Do not put access tokens in the README or clone URL.

Before continuing, locate:

- The backend `pom.xml` and wrapper files.
- The frontend `package.json` and lockfile.
- Backend `application*.properties` or `application*.yml` files.
- Frontend environment examples and Vite configuration.
- Database migration/schema/seed scripts and setup documentation.

The commands below use `backend` and `frontend` as example directory names. Replace them if the checkout uses another layout. Do not create duplicate folders just to match these examples.

### 3. Prepare SQL Server

1. Start the SQL Server service.
2. Connect using SSMS.
3. Identify the server/instance, database name, authentication mode, and configured TCP port.
4. Enable TCP/IP and the relevant firewall rule only if the application needs a TCP connection and the instance is not already configured.
5. Restart the SQL Server service after changing network settings.
6. Create the database named in the backend configuration if it does not exist.
7. Provision the application's database user with the permissions required by the project's initialization approach.

Database names, usernames, passwords, and ports below are placeholders. Do not assume SQL Server uses port 1433 for every instance.

Example database creation, run in SSMS after replacing the name:

```sql
CREATE DATABASE [YOUR_DATABASE_NAME];
GO
```

### 4. Configure the backend

Inspect the repository's actual configuration. Prefer its environment/profile mechanism rather than committing machine-specific secrets.

Standard Spring property examples:

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=YOUR_DATABASE_NAME;encrypt=true;trustServerCertificate=true
spring.datasource.username=YOUR_DATABASE_USER
spring.datasource.password=YOUR_DATABASE_PASSWORD
```

The JDBC example is for a local development instance. Production should use trusted certificates and environment-specific configuration. Preserve any driver, dialect, profile, and initialization settings already used by the project.

For standard Spring datasource properties, PowerShell environment variables can be used:

```powershell
$env:SPRING_DATASOURCE_URL = 'jdbc:sqlserver://localhost:1433;databaseName=YOUR_DATABASE_NAME;encrypt=true;trustServerCertificate=true'
$env:SPRING_DATASOURCE_USERNAME = 'YOUR_DATABASE_USER'
$env:SPRING_DATASOURCE_PASSWORD = 'YOUR_DATABASE_PASSWORD'
```

Set additional **actual project keys** for JWT, CORS, email, and file storage if required. Their exact names and defaults could not be verified. Do not invent a JWT key name or assume notifications work without configuration. `.env` files are not automatically read by every Spring Boot project.

Do not change `spring.jpa.hibernate.ddl-auto` merely to make startup succeed. First read the next section.

### 5. Configure the frontend

```powershell
cd frontend
npm ci
```

Use `npm ci` when a matching `package-lock.json` is committed. Otherwise use the project's package manager and documented installation command; `npm install` is appropriate for an npm project without a lockfile.

Copy the supplied environment example if present. Determine the actual API variable by reading the shared API client, `import.meta.env` usages, or Vite proxy configuration.

```text
VITE_<ACTUAL_API_VARIABLE>=<BACKEND_API_BASE_URL>
```

This is a placeholder, not a usable variable name. Match the backend URL and API prefix exactly. Vite client environment values are public: never place JWT signing secrets or database credentials there.

## Database setup and consistency

A fresh clone contains application code; it does not automatically contain another developer's database records.

Use the schema initialization mechanism actually included in the repository:

| Mechanism found in source | Setup action |
|---|---|
| Versioned Flyway/Liquibase migrations | Configure the connection and run the application's documented migration/startup flow. |
| Checked-in SQL scripts | Execute them in documented order against the intended database. |
| Hibernate schema creation/update | Confirm entity mappings and the configured mode; recognize that this does not reproduce all custom SQL objects or seed data. |
| No complete initialization path | Obtain the maintainer's schema/migration package or a database backup before claiming a fresh setup is complete. |

Never use `create` or `create-drop` against a database containing needed data. Back up existing databases before schema repair or migration.

Previously reported consistency checks include:

- `appointment_reschedule_history`
- `reservation_refunds`
- `ownership_records`

After initialization, inspect their presence:

```sql
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_NAME IN (
    'appointment_reschedule_history',
    'reservation_refunds',
    'ownership_records'
  );
```

This verifies existence only. Also verify columns, foreign keys, indexes, and constraints against the checked-in schema. Automatic recreation of one mapped table does not prove the complete schema will be recreated.

If a table is missing, inspect entity scanning, entity annotations, active profile, migration history, startup errors, and database permissions. Do not create an empty guessed table just to remove an exception.

To reproduce **the same data**, use an approved backup/restore or maintained seed/export scripts. Migrations usually reproduce structure rather than private customer data.

## Run the application

Use two terminals. Keep both running.

### Terminal 1: backend

From the directory containing `pom.xml`:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

If there is no wrapper:

```powershell
mvn spring-boot:run
```

On Linux/macOS with a supplied wrapper:

```bash
./mvnw spring-boot:run
```

Wait for successful application startup. Read the logs to identify the actual backend port and active profile. Configure the frontend and CORS to use that port.

### Terminal 2: frontend

From the directory containing `package.json`:

```powershell
cd frontend
npm run dev
```

Open the URL printed by Vite. The development URL observed in project context is `http://localhost:5173`, but Vite may select another port if it is occupied.

Restart Vite after changing frontend environment files. Restart the backend after changing its startup environment/configuration.

Stop a server with `Ctrl+C` in its terminal.

## First-use walkthrough

1. Confirm the frontend loads and API requests reach the backend.
2. Register/sign in using the actual supported account flow.
3. Obtain an administrator account using the repository's approved seed/provisioning process. No default administrator credentials are documented here.
4. As management, create an apartment and confirm it begins as Available.
5. As a customer, browse apartment details and exercise the appointment workflow.
6. Request a reservation; confirm no paid hold countdown starts before fee confirmation.
7. Record and confirm the reservation fee using the implemented payment workflow.
8. Confirm the four-day hold and 48-hour cancellation deadline use the same confirmation timestamp in customer and management views.
9. Exercise cancellation approval/refund release on test data and confirm the history remains visible.
10. Exercise full-payment and installment flows; compare monthly receipts with full Sales & Records values.
11. Confirm sign-out asks for confirmation.

Use test accounts and test records when checking financial workflows.

## Build and tests

### Backend

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd package
```

Use equivalent `mvn` commands if no wrapper is supplied. `package` normally runs tests as part of the Maven lifecycle; an additional test run is optional if nothing changed.

A previously supplied result reported **136 tests, 0 failures, 0 errors, 0 skipped, BUILD SUCCESS**. This is historical evidence, not a test run performed for this README. The current checkout's result is authoritative.

### Frontend

```powershell
cd frontend
npm run build
```

Check `package.json` before running additional lint/typecheck/test scripts; do not assume these scripts exist. If the build script does not include type checking, use the repository's documented TypeScript check separately.

For local inspection of a built frontend, use `npm run preview` only if supplied. Preview is not a production backend deployment.

## Troubleshooting

| Symptom | What to check |
|---|---|
| `java` works in normal PowerShell but not the editor | Fully restart the editor; compare `Get-Command java`, `where.exe java`, and `JAVA_HOME`. |
| Incorrect Java version | Set JDK 17 for the terminal and Maven; check `mvn -version` or the wrapper's `-version` output. |
| Maven cannot delete `target/classes` | Stop the backend/debugger and processes holding those files, then retry. |
| Port already in use | Identify the listener and stop only the known project process, or configure a matching alternate port. |
| SQL Server connection fails | Confirm service, instance, TCP settings, port, authentication, database name, JDBC URL, and certificate configuration. |
| Fresh clone is missing tables | Verify the initialization mechanism, migration state, entity scanning, profile, and schema permissions. |
| UI loads but API requests fail | Check API base URL/proxy, backend startup, CORS, authentication, and the HTTP response. |
| `/reservations` is blank | Inspect the error; a reported crash was `useAuth is not defined` in `ReservationsPage.tsx`. Restore the existing hook import and run the build. |
| Countdowns disagree | Confirm both views use fee confirmation, not request creation, and parse timestamps with consistent timezone handling. |
| Negative countdowns | Clamp remaining time and display expired/final states. |
| Refund missing from payment history | Check the link between reservation, cancellation, refund record, and history API/UI. |
| Monthly income equals entire installment sale price | Audit received installment amounts and reporting dates separately from full sale value. |
| Full payment shows cancelled/closed | Audit the underlying sale/payment/reservation states and status mapping. |
| Email does not arrive | Check whether email is implemented/enabled and verify provider configuration and delivery logs. |
| SSMS cannot create diagrams | Diagram designer compatibility does not determine whether SQL Server works; use maintained schema/ER documentation. |
| Yellow Java underlines | Read each diagnostic. Remove unused imports safely; preserve side effects, tests, and intended design patterns. |

Useful PowerShell commands:

```powershell
Get-Command java
where.exe java
$env:JAVA_HOME
Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess
```

Avoid indiscriminately stopping all Java processes or deleting database tables.

## Security and operational notes

- Backend role checks and JWT validation must protect management operations.
- Never commit database passwords, signing secrets, email credentials, tokens, or real customer data.
- Preserve payment, cancellation, refund, and ownership audit history.
- A recorded refund release is not proof of an automated bank transfer; this project's documented workflow does not require a payment gateway.
- Keep financial updates consistent and avoid duplicate processing on retries.
- Back up the database and any separately stored uploads before transferring an installation.
- Use HTTPS and appropriate certificates, origins, secrets, and storage settings for deployment.
- Development commands in this README are not a complete production deployment guide.


## Maintainer verification checklist

Before adopting this file as the final repository README:

- [ ] Audit every current frontend route and backend module; add any features missing from this documented scope.
- [ ] Replace example frontend/backend directories with their exact paths.
- [ ] Specify the supported Node.js/npm versions.
- [ ] Document exact environment keys, defaults, active profiles, API prefix, backend port, and CORS settings.
- [ ] Provide a complete fresh-database initialization sequence and seed instructions.
- [ ] Confirm all three previously reported tables are included in that sequence.
- [ ] Document approved first-administrator provisioning without exposing secrets.
- [ ] Verify payment, refund, notification, ownership, and installment workflows actually match the rules above.
- [ ] Distinguish implemented notifications/customer acknowledgement from planned work.
- [ ] Replace historical test information with current verified results.
- [ ] Run the setup from a clean laptop/database and record the outcome.
- [ ] Confirm the complete feature inventory and remove this draft verification notice after source review.

## Team of Members

#### **IT25100393** - Pathirannehelage T. J. T.  

#### **IT25102539** - Ransith K. T.   

#### **IT25103131** - Dharmapala H.K.S.  

#### **IT25103860** - Kumarge P. T. A. M.  

#### **IT25103871** - Jathusayinie K.  

#### **IT25103887** - Kahanda I. M.  