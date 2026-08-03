# Skyline Living Backend Setup Guide

## Requirements
- Java 21 or newer
- Microsoft SQL Server
- SQL Server Management Studio
- Git
- VS Code or IntelliJ IDEA
- Postman, optional

## Clone
```bash
git clone <repository-url>
cd skyline-living-backend
```

## Database
Run:
```text
database/01_schema.sql
database/02_seed_roles.sql
```

Default database:
```text
SkylineLivingDB_Test
```

## Local Configuration
Create:
```text
src/main/resources/application-local.properties
```

Example:
```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=SkylineLivingDB_Test;encrypt=true;trustServerCertificate=true
spring.datasource.username=YOUR_DATABASE_USERNAME
spring.datasource.password=YOUR_DATABASE_PASSWORD
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

server.port=8080

jwt.secret=YOUR_LONG_SECURE_JWT_SECRET
jwt.expiration=86400000

file.upload-dir=uploads

spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=20MB
spring.servlet.multipart.max-request-size=20MB
```

Do not commit this file.

## Run
```powershell
.\mvnw.cmd clean
.\mvnw.cmd spring-boot:run
```

Expected:
```text
Tomcat started on port 8080
Started SkylineLivingBackendApplication
DATABASE CONNECTION SUCCESSFUL
```

## Swagger
```text
http://localhost:8080/swagger-ui/index.html
```

For protected APIs:
1. Login using `POST /api/auth/login`.
2. Copy the JWT token.
3. Click `Authorize`.
4. Paste only the token.

## Upload Folders
```text
uploads/profile-images/
uploads/payment-evidence/
uploads/apartment-images/
uploads/floor-plans/
uploads/brochures/
uploads/videos/
```

## Common Problems
### Port 8080 in use
Stop the existing Java process or change `server.port`.

### Database login failed
Check SQL Server service, TCP/IP, port 1433, credentials, and database name.

### JWT secret error
Ensure `jwt.secret` exists in `application-local.properties`.

### Swagger 403
Permit:
```text
/swagger-ui/**
/swagger-ui.html
/v3/api-docs
/v3/api-docs/**
```

### BUILD SUCCESS but server stops
Read the Spring error above the Maven summary. The ApplicationContext may still have failed.
