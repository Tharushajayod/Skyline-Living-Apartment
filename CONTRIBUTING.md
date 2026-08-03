# Contributing to Skyline Living Apartment Sale System

## Before Starting
```bash
git checkout main
git pull origin main
git checkout -b <branch-name>
```

Recommended branches:
- apartment-management
- appointment-management
- inquiry-management
- reservation-management
- sales-management
- payment-transactions
- review-notification-favorites

Do not develop directly on `main`.

## Standard Module Structure
```text
entity/ModuleEntity.java
repository/ModuleRepository.java
dto/module/CreateModuleRequest.java
dto/module/UpdateModuleRequest.java
dto/module/ModuleResponse.java
service/ModuleService.java
service/impl/ModuleServiceImpl.java
controller/ModuleController.java
```

Request flow:
```text
Controller -> Service -> Repository -> Database
```

## Coding Rules
- Use DTOs for requests and responses.
- Do not expose entities directly.
- Use `@Valid` for validation.
- Use constructor injection.
- Use `@Transactional` for writes.
- Use `@Transactional(readOnly = true)` for reads.
- Reuse common services.
- Do not create duplicate controllers or endpoints.
- Use these role names exactly:

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

## Database Rules
- Do not rename shared tables or columns without informing the group.
- Do not create duplicate tables.
- Check the shared schema before creating entities.
- Add every schema change to the shared SQL scripts.
- Never store plain-text passwords.
- Never commit database passwords or JWT secrets.

## File Upload Rules
Use the existing `FileStorageService`.

Common categories:
```text
profile-images
payment-evidence
apartment-images
project-images
floor-plans
brochures
videos
sale-documents
```

Private files such as payment evidence must remain authenticated.

## Testing
Before committing:
```powershell
.\mvnw.cmd clean
.\mvnw.cmd spring-boot:run
```

Confirm:
- The application compiles.
- Tomcat starts.
- Database connection succeeds.
- New APIs work in Postman or Swagger.
- Role restrictions work.
- Existing APIs are not broken.

Swagger:
```text
http://localhost:8080/swagger-ui/index.html
```

## Commit and Push
```bash
git status
git add .
git commit -m "Complete reservation management module"
git push origin <branch-name>
```

Use clear commit messages. Avoid `update`, `done`, `final`, or `changes`.

## Pull Requests
Explain:
- What was implemented
- Endpoints added
- Tables used
- Allowed roles
- Testing completed
- Database changes

Do not merge when the project does not compile, conflicts remain, scripts are missing, or secrets are included.

## Do Not Commit
```text
target/
uploads/
.env
src/main/resources/application-local.properties
database passwords
JWT secrets
```

Inform the group before changing shared classes such as `SecurityConfig`, `JwtService`, `GlobalExceptionHandler`, `FileStorageService`, `User`, `Role`, `Customer`, or `Staff`.
