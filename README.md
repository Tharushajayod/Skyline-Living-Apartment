# Skyline Living Apartment Sale System - Backend

A secure RESTful backend API for the Skyline Living Apartment Sale System developed using Spring Boot.

---

# Project Overview

Skyline Living Apartment Sale System is a web-based apartment selling platform developed for a property development company.

The backend provides REST APIs for:

- User Authentication
- Role Based Authorization
- Apartment Management
- Customer Management
- Reservation Management
- Payment & Transaction Management
- Appointment Management
- Inquiry Management
- File Upload
- Reports
- Dashboard Statistics

---

# Technology Stack

Backend Framework

- Spring Boot 4
- Spring Security
- Spring Data JPA
- Hibernate
- Maven

Database

- Microsoft SQL Server

Authentication

- JWT Authentication

Documentation

- Swagger OpenAPI

File Storage

- Local File Storage

Language

- Java 21

---

# Project Structure

```
src
 ├── controller
 ├── dto
 ├── entity
 ├── repository
 ├── security
 ├── service
 │      └── impl
 ├── config
 ├── exception
 └── util
```

---

# Features

## Authentication

- Register Customer
- Login
- JWT Authentication
- Logout
- Change Password
- Update Profile
- Upload Profile Image
- Remove Profile Image

---

## User Management

- Customer Profile
- Staff Profile
- Admin Profile
- Role Based Access Control

---

## Apartment Management

- Apartment CRUD
- Apartment Availability
- Apartment Images
- Apartment Search

---

## Reservation Management

- Create Reservation
- Cancel Reservation
- Reservation History

---

## Payment Management

Implemented Features

- Create Payment
- Get Payment
- Get Customer Payments
- Update Payment Status
- Upload Payment Evidence
- Delete Payment Evidence
- View Payment Evidence
- View Payment Details
- Customer Payment History
- Finance Dashboard Summary
- Monthly Revenue Report
- Outstanding Payment Report

---

## Transaction Management

- Auto Transaction Creation
- Receipt Number Generation
- Transaction History
- Customer Transactions

---

## Reports

Finance Reports

- Dashboard Summary
- Monthly Revenue
- Outstanding Payments

---

## File Management

- Upload Payment Evidence
- Upload Profile Images
- Download Files
- Delete Files

---

# Security

JWT Authentication

Role Based Authorization

Roles

- ADMIN
- CUSTOMER
- SALES_MANAGER
- OPERATIONS_MANAGER
- CUSTOMER_RELATIONS_OFFICER
- FINANCE_OFFICER
- MARKETING_EXECUTIVE
- STAFF

Example

Customer cannot

- Verify Payments
- View Finance Reports

Finance Officer can

- Verify Payments
- Reject Payments
- View Reports

Admin

- Full Access

---

# Swagger API Documentation

After running the project

```
http://localhost:8080/swagger-ui/index.html
```

---

# Database

Microsoft SQL Server

Default Database

```
SkylineLivingDB_Test
```

Database scripts are available in

```
database/
```

```
database/
│
├──01_schema.sql
├──02_seed_roles.sql
└──README.md
```

---

# File Upload Location

```
uploads/

├──payment-evidence
└──profile-images
```

---

# Running the Project

Clone Repository

```
git clone <repository-url>
```

Open Project

```
VS Code

or

IntelliJ IDEA
```

Run

```
./mvnw spring-boot:run
```

Application URL

```
http://localhost:8080
```

---

# API Authentication

Login

```
POST

/api/auth/login
```

Copy JWT Token

Open Swagger

Click

```
Authorize
```

Paste only

```
eyJhbGciOi...
```

Swagger automatically sends

```
Authorization: Bearer <token>
```

---

# Team Development Workflow

Create new branch

```
git checkout -b feature-name
```

Examples

```
payment-transactions

reservation-management

apartment-management

appointment-management

sales-management
```

Commit

```
git add .

git commit -m "Complete payment module"
```

Push

```
git push origin payment-transactions
```

Create Pull Request

Merge into

```
main
```

---

# Coding Standards

Package Structure

Controller

↓

Service

↓

Repository

↓

Database

Use DTOs

Never expose Entity directly

Validation

Use

```
@Valid
```

Use Global Exception Handler

Follow REST API naming conventions

---

# API Response Format

Success

```json
{
    "paymentId":1,
    "paymentStatus":"PAID"
}
```

Error

```json
{
    "success":false,
    "message":"Payment not found",
    "timestamp":"..."
}
```

---

# Completed Modules

Authentication

✔

Payment Management

✔

Transaction Management

✔

File Upload

✔

Swagger Documentation

✔

JWT Security

✔

Reports

✔

---

# Pending Modules

Apartment Management

Reservation Management

Appointment Management

Inquiry Management

Notification Module

Email Verification

Frontend Integration

---

# Contributors

Group

26-MTR-SE2030-12

Project

Skyline Living Apartment Sale System

Developed using

Spring Boot

Microsoft SQL Server

JWT Authentication

Swagger OpenAPI