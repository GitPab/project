# SACMA Data Dictionary

Complete reference of all data entities, fields, and types used in the application.

## Table of Contents
1. [Users](#users)
2. [Universities](#universities)
3. [Registrations](#registrations)
4. [Audit Logs](#audit-logs)
5. [Role Permissions](#role-permissions)

---

## Users

User accounts for students and administrators.

| Field | Type | MySQL | PostgreSQL | Required | Default | Description |
|-------|------|-------|------------|----------|---------|-------------|
| id | UUID/VARCHAR(36) | VARCHAR(36) | UUID | Yes | Auto-generated | Unique identifier |
| name | String | VARCHAR(200) | TEXT | Yes | - | Full name |
| email | String | VARCHAR(255) | TEXT | Yes | - | Unique email address |
| phone | String | VARCHAR(50) | TEXT | No | NULL | Phone number |
| password | String | VARCHAR(255) | TEXT | Yes | - | Hashed password (bcrypt) |
| role | Enum/String | ENUM | TEXT | Yes | 'student' | User role (see below) |
| is_first_login | Boolean | BOOLEAN | BOOLEAN | No | FALSE | First-time login flag |
| setup_token | String | VARCHAR(128) | TEXT | No | NULL | Password setup token |
| setup_token_expiry | DateTime | TIMESTAMP | TIMESTAMP | No | NULL | Token expiration |
| invited_by | UUID/FK | VARCHAR(36) | UUID | No | NULL | Referrer user ID |
| is_active | Boolean | BOOLEAN | BOOLEAN | No | TRUE | Account active status |
| last_login | DateTime | TIMESTAMP | TIMESTAMP | No | NULL | Last login timestamp |
| created_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation date |
| updated_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Last update |

### User Roles

| Role | Permissions |
|------|-------------|
| super_admin | Full access to all features |
| admin | Full access to all features |
| admin_manager | View students, manage applications, view analytics |
| content_editor | Manage universities, view students |
| finance_admin | View payments, manage payments, view analytics |
| viewer | Read-only access to all data |
| student | View universities, create applications |

---

## Universities

University/institution information.

| Field | Type | MySQL | PostgreSQL | Required | Default | Description |
|-------|------|-------|------------|----------|---------|-------------|
| id | UUID/VARCHAR(36) | VARCHAR(36) | UUID | Yes | Auto-generated | Unique identifier |
| name | String | VARCHAR(200) | TEXT | Yes | - | University name (English) |
| korean_name | String | VARCHAR(200) | TEXT | No | NULL | University name (Korean) |
| country | String | VARCHAR(100) | TEXT | No | 'Hàn Quốc' | Country |
| region | String | VARCHAR(100) | TEXT | No | NULL | Region/province |
| ranking | String/Integer | VARCHAR(50) | INTEGER | No | NULL | University ranking |
| top_tier | String | VARCHAR(10) | TEXT | No | NULL | Top tier classification |
| hero_image | Text | TEXT | TEXT | No | NULL | Main banner image URL |
| thumbnail | Text | TEXT | TEXT | No | NULL | Thumbnail image URL |
| korean_data | JSON | JSON | JSONB | No | NULL | Additional Korean data |
| cache_version | Integer | INT | INTEGER | No | 0 | Cache version number |
| updated_by | UUID/FK | VARCHAR(36) | UUID | No | NULL | Last updated by user ID |
| is_active | Boolean | BOOLEAN | BOOLEAN | No | TRUE | Soft delete flag |
| created_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation date |
| updated_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Last update |

---

## Registrations

Student applications/registrations to universities.

| Field | Type | MySQL | PostgreSQL | Required | Default | Description |
|-------|------|-------|------------|----------|---------|-------------|
| id | UUID/VARCHAR(36) | VARCHAR(36) | UUID | Yes | Auto-generated | Unique identifier |
| student_id | UUID/FK | VARCHAR(36) | UUID | Yes | - | Student user ID |
| university_id | UUID/FK | VARCHAR(36) | UUID | Yes | - | University ID |
| visa_system | String | VARCHAR(50) | TEXT | No | NULL | Visa type (C-3, D-2, etc) |
| status | String | VARCHAR(50) | TEXT | No | 'pending' | Application status |
| form_data | JSON | JSON | JSONB | No | NULL | Additional form data |
| created_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation date |
| updated_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Last update |

### Registration Status Values

| Status | Description |
|--------|-------------|
| pending | Awaiting review |
| approved | Application approved |
| rejected | Application rejected |
| processing | Under review |

---

## Audit Logs

System audit trail for all changes.

| Field | Type | MySQL | PostgreSQL | Required | Default | Description |
|-------|------|-------|------------|----------|---------|-------------|
| id | UUID/VARCHAR(36) | VARCHAR(36) | UUID | Yes | Auto-generated | Unique identifier |
| user_id | UUID/FK | VARCHAR(36) | UUID | No | NULL | User who performed action |
| action | Enum | ENUM | TEXT | Yes | - | Action type |
| entity_type | String | VARCHAR(100) | TEXT | Yes | - | Entity affected |
| entity_id | UUID | VARCHAR(36) | UUID | No | NULL | Specific entity ID |
| old_values | JSON | JSON | JSONB | No | NULL | Previous values |
| new_values | JSON | JSON | JSONB | No | NULL | New values |
| ip_address | String | VARCHAR(45) | INET | No | NULL | Client IP address |
| user_agent | Text | TEXT | TEXT | No | NULL | Browser user agent |
| created_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | When action occurred |

### Audit Action Types

| Action | Description |
|--------|-------------|
| CREATE | New record created |
| UPDATE | Record modified |
| DELETE | Record deleted (soft) |
| RESTORE | Record restored |
| LOGIN | User logged in |
| LOGOUT | User logged out |
| SYNC | Database sync performed |
| OPTIMIZE | Database optimized |
| BACKUP | Backup created |

---

## Database Indexes

### Users Table
- `idx_users_email` - Email lookups
- `idx_users_role` - Role-based queries
- `idx_users_is_active` - Active user filtering

### Universities Table
- `idx_universities_name` - Name search

### Registrations Table
- `idx_registrations_student` - Student's applications
- `idx_registrations_university` - University's applicants

### Audit Logs Table
- `idx_audit_logs_entity` - Entity history lookup
- `idx_audit_logs_user` - User activity
- `idx_audit_logs_created` - Time-based queries

---

## Foreign Key Relationships

```
users (invited_by) → users (id)
universities (updated_by) → users (id)
registrations (student_id) → users (id)
registrations (university_id) → universities (id)
audit_logs (user_id) → users (id)
```

---

## Data Type Mappings

| Conceptual | MySQL | PostgreSQL |
|------------|-------|------------|
| UUID | VARCHAR(36) | UUID |
| String | VARCHAR(n) | TEXT |
| Boolean | BOOLEAN | BOOLEAN |
| DateTime | TIMESTAMP | TIMESTAMP |
| JSON | JSON | JSONB |
| Enum | ENUM | TEXT with CHECK |
| IP Address | VARCHAR(45) | INET |

---

## Programs

Available study programs at universities.

| Field | Type | MySQL | PostgreSQL | Required | Default | Description |
|-------|------|-------|------------|----------|---------|-------------|
| id | UUID/VARCHAR(36) | VARCHAR(36) | UUID | Yes | Auto-generated | Unique identifier |
| university_id | UUID/FK | VARCHAR(36) | UUID | Yes | - | University ID |
| name | String | VARCHAR(255) | TEXT | Yes | - | Program name (English) |
| korean_name | String | VARCHAR(255) | TEXT | No | NULL | Program name (Korean) |
| degree_type | Enum | ENUM | VARCHAR(50) | Yes | - | bachelor/master/phd/language/short_term |
| language | Enum | ENUM | VARCHAR(20) | No | 'korean' | korean/english/mixed |
| duration_months | Integer | INT | INTEGER | No | NULL | Duration in months |
| tuition_fee | Decimal | DECIMAL(15,2) | DECIMAL(15,2) | No | NULL | Tuition cost |
| currency | String | VARCHAR(3) | VARCHAR(3) | No | 'KRW' | Currency code |
| description | Text | TEXT | TEXT | No | NULL | Program description |
| requirements | Text | TEXT | TEXT | No | NULL | Admission requirements |
| deadline | Date | DATE | DATE | No | NULL | Application deadline |
| intake_dates | JSON | JSON | JSONB | No | NULL | Available intake dates |
| is_active | Boolean | BOOLEAN | BOOLEAN | No | TRUE | Soft delete flag |
| created_by | UUID/FK | VARCHAR(36) | UUID | No | NULL | Created by user ID |
| created_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation date |
| updated_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Last update |

---

## Student Profiles

Extended student information and background.

| Field | Type | MySQL | PostgreSQL | Required | Default | Description |
|-------|------|-------|------------|----------|---------|-------------|
| id | UUID/VARCHAR(36) | VARCHAR(36) | UUID | Yes | Auto-generated | Unique identifier |
| user_id | UUID/FK | VARCHAR(36) | UUID | Yes | - | Student user ID |
| date_of_birth | Date | DATE | DATE | No | NULL | Date of birth |
| gender | Enum | ENUM | VARCHAR(20) | No | NULL | male/female/other |
| nationality | String | VARCHAR(100) | TEXT | No | NULL | Nationality |
| passport_number | String | VARCHAR(100) | TEXT | No | NULL | Passport number |
| passport_expiry | Date | DATE | DATE | No | NULL | Passport expiry date |
| address | Text | TEXT | TEXT | No | NULL | Home address |
| city | String | VARCHAR(100) | TEXT | No | NULL | City |
| country | String | VARCHAR(100) | TEXT | No | NULL | Country |
| emergency_contact_name | String | VARCHAR(200) | TEXT | No | NULL | Emergency contact name |
| emergency_contact_phone | String | VARCHAR(50) | TEXT | No | NULL | Emergency contact phone |
| emergency_contact_relation | String | VARCHAR(50) | TEXT | No | NULL | Relation to student |
| education_level | Enum | ENUM | VARCHAR(50) | Yes | - | high_school/bachelor/master/phd |
| school_name | String | VARCHAR(255) | TEXT | No | NULL | Previous school |
| graduation_year | Integer | INT | INTEGER | No | NULL | Graduation year |
| gpa | Decimal | DECIMAL(3,2) | DECIMAL(3,2) | No | NULL | GPA score |
| korean_level | Enum | ENUM | VARCHAR(20) | No | NULL | none/beginner/intermediate/advanced/native |
| english_level | Enum | ENUM | VARCHAR(20) | No | NULL | none/beginner/intermediate/advanced/native |
| has_korean_certificate | Boolean | BOOLEAN | BOOLEAN | No | FALSE | Has Korean language cert |
| korean_certificate_score | String | VARCHAR(50) | TEXT | No | NULL | TOPIK score or equivalent |
| bio | Text | TEXT | TEXT | No | NULL | Student bio |
| profile_image_url | Text | TEXT | TEXT | No | NULL | Profile photo URL |
| created_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation date |
| updated_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Last update |

---

## Payments

Financial transactions and invoices.

| Field | Type | MySQL | PostgreSQL | Required | Default | Description |
|-------|------|-------|------------|----------|---------|-------------|
| id | UUID/VARCHAR(36) | VARCHAR(36) | UUID | Yes | Auto-generated | Unique identifier |
| student_id | UUID/FK | VARCHAR(36) | UUID | Yes | - | Student user ID |
| registration_id | UUID/FK | VARCHAR(36) | UUID | No | NULL | Related application |
| amount | Decimal | DECIMAL(15,2) | DECIMAL(15,2) | Yes | - | Payment amount |
| currency | String | VARCHAR(3) | VARCHAR(3) | No | 'VND' | Currency code |
| payment_method | Enum | ENUM | VARCHAR(50) | Yes | - | bank_transfer/credit_card/cash/paypal/stripe |
| payment_type | Enum | ENUM | VARCHAR(50) | No | 'application_fee' | application_fee/tuition/deposit/other |
| status | Enum | ENUM | VARCHAR(50) | No | 'pending' | pending/completed/failed/refunded/cancelled |
| transaction_id | String | VARCHAR(255) | TEXT | No | NULL | External transaction ID |
| payment_proof_url | Text | TEXT | TEXT | No | NULL | Screenshot/receipt URL |
| description | Text | TEXT | TEXT | No | NULL | Payment description |
| notes | Text | TEXT | TEXT | No | NULL | Admin notes |
| processed_by | UUID/FK | VARCHAR(36) | UUID | No | NULL | Processed by admin |
| paid_at | DateTime | TIMESTAMP | TIMESTAMP | No | NULL | Payment completion date |
| created_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation date |
| updated_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Last update |

---

## Documents

Uploaded files and documents.

| Field | Type | MySQL | PostgreSQL | Required | Default | Description |
|-------|------|-------|------------|----------|---------|-------------|
| id | UUID/VARCHAR(36) | VARCHAR(36) | UUID | Yes | Auto-generated | Unique identifier |
| student_id | UUID/FK | VARCHAR(36) | UUID | Yes | - | Student user ID |
| document_type | Enum | ENUM | VARCHAR(50) | Yes | - | passport/transcript/diploma/photo/recommendation/essay/financial_proof/other |
| file_name | String | VARCHAR(255) | TEXT | Yes | - | Original file name |
| file_url | Text | TEXT | TEXT | Yes | - | File storage URL |
| file_size | Integer | INT | INTEGER | No | NULL | File size in bytes |
| mime_type | String | VARCHAR(100) | TEXT | No | NULL | MIME type |
| status | Enum | ENUM | VARCHAR(50) | No | 'pending' | pending/approved/rejected |
| notes | Text | TEXT | TEXT | No | NULL | Review notes |
| reviewed_by | UUID/FK | VARCHAR(36) | UUID | No | NULL | Reviewed by admin |
| reviewed_at | DateTime | TIMESTAMP | TIMESTAMP | No | NULL | Review date |
| created_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation date |
| updated_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Last update |

---

## Notifications

System alerts and user notifications.

| Field | Type | MySQL | PostgreSQL | Required | Default | Description |
|-------|------|-------|------------|----------|---------|-------------|
| id | UUID/VARCHAR(36) | VARCHAR(36) | UUID | Yes | Auto-generated | Unique identifier |
| user_id | UUID/FK | VARCHAR(36) | UUID | Yes | - | Recipient user ID |
| type | Enum | ENUM | VARCHAR(20) | No | 'info' | info/success/warning/error |
| title | String | VARCHAR(255) | TEXT | Yes | - | Notification title |
| message | Text | TEXT | TEXT | Yes | - | Notification body |
| link | String | VARCHAR(500) | TEXT | No | NULL | Related link |
| is_read | Boolean | BOOLEAN | BOOLEAN | No | FALSE | Read status |
| read_at | DateTime | TIMESTAMP | TIMESTAMP | No | NULL | Read timestamp |
| created_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation date |

---

## Messages

Internal messaging between users.

| Field | Type | MySQL | PostgreSQL | Required | Default | Description |
|-------|------|-------|------------|----------|---------|-------------|
| id | UUID/VARCHAR(36) | VARCHAR(36) | UUID | Yes | Auto-generated | Unique identifier |
| sender_id | UUID/FK | VARCHAR(36) | UUID | Yes | - | Sender user ID |
| recipient_id | UUID/FK | VARCHAR(36) | UUID | Yes | - | Recipient user ID |
| subject | String | VARCHAR(255) | TEXT | No | NULL | Message subject |
| content | Text | TEXT | TEXT | Yes | - | Message body |
| is_read | Boolean | BOOLEAN | BOOLEAN | No | FALSE | Read status |
| read_at | DateTime | TIMESTAMP | TIMESTAMP | No | NULL | Read timestamp |
| parent_id | UUID/FK | VARCHAR(36) | UUID | No | NULL | Parent message ID (thread) |
| attachments | JSON | JSON | JSONB | No | NULL | Attached files |
| is_deleted_by_sender | Boolean | BOOLEAN | BOOLEAN | No | FALSE | Deleted by sender |
| is_deleted_by_recipient | Boolean | BOOLEAN | BOOLEAN | No | FALSE | Deleted by recipient |
| created_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation date |

---

## Application Timeline

Track application progress stages.

| Field | Type | MySQL | PostgreSQL | Required | Default | Description |
|-------|------|-------|------------|----------|---------|-------------|
| id | UUID/VARCHAR(36) | VARCHAR(36) | UUID | Yes | Auto-generated | Unique identifier |
| registration_id | UUID/FK | VARCHAR(36) | UUID | Yes | - | Application ID |
| stage | Enum | ENUM | VARCHAR(50) | Yes | - | submitted/document_review/interview/university_review/accepted/rejected/enrolled |
| status | Enum | ENUM | VARCHAR(50) | No | 'pending' | pending/in_progress/completed/failed |
| notes | Text | TEXT | TEXT | No | NULL | Stage notes |
| completed_at | DateTime | TIMESTAMP | TIMESTAMP | No | NULL | Completion date |
| completed_by | UUID/FK | VARCHAR(36) | UUID | No | NULL | Completed by user |
| created_at | DateTime | TIMESTAMP | TIMESTAMP | Yes | CURRENT_TIMESTAMP | Creation date |

---

## Complete Table List

| # | Table | Purpose | Records |
|---|-------|---------|---------|
| 1 | users | User accounts | Users & Admins |
| 2 | universities | University data | Institutions |
| 3 | programs | Study programs | Programs/Courses |
| 4 | registrations | Applications | Student applications |
| 5 | student_profiles | Extended student info | Background data |
| 6 | payments | Financial transactions | Invoices & receipts |
| 7 | documents | Uploaded files | Passports, transcripts |
| 8 | notifications | System alerts | User notifications |
| 9 | messages | Internal messaging | Admin-student chat |
| 10 | application_timeline | Progress tracking | Application stages |
| 11 | audit_logs | Audit trail | Change history |

---

## Environment Variables

| Variable | MySQL | PostgreSQL |
|----------|-------|------------|
| DB_TYPE | mysql | postgresql |
| DATABASE_URL | - | postgresql://... |
| MYSQL_HOST | localhost | - |
| MYSQL_PORT | 3306 | - |
| MYSQL_USER | root | - |
| MYSQL_PASSWORD | Admin@1234 | - |
| MYSQL_DATABASE | sacma | - |
