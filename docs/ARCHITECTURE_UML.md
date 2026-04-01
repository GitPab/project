# Du Học Cost - System Architecture UML

## 1. System Architecture Overview

```mermaid
---
id: f02f9d52-a758-4328-9cba-c9852115ec8f
---
graph TB
    subgraph "Client Layer"
        A[Web Browser]
    end

    subgraph "Frontend (Vercel)"
        B[React + Vite App]
        B1[React Router]
        B2[AuthContext]
        B3[AppContext]
        B4[RBAC Components]
        B5[UI Components]
    end

    subgraph "Backend (Render)"
        C[Node.js + Express]
        C1[Authentication Middleware]
        C2[RBAC Middleware]
        C3[API Routes]
        C4[File Upload Handler]
    end

    subgraph "Database Layer"
        D[(PostgreSQL)]
        D1[Users Table]
        D2[Universities Table]
        D3[Registrations Table]
        D4[Student Progress Table]
    end

    subgraph "External Services"
        E[Imgur API]
        F[JWT Token Service]
    end

    A -->|HTTPS| B
    B -->|REST API| C
    C -->|SQL Queries| D
    C -->|Image Upload| E
    C -->|Token Verify| F

    B --> B1
    B --> B2
    B --> B3
    B --> B4
    B --> B5

    C --> C1
    C --> C2
    C --> C3
    C --> C4

    D --> D1
    D --> D2
    D --> D3
    D --> D4
```

## 2. Frontend Component Architecture

```mermaid
---
id: 055d2ce8-59ad-4494-b6ce-aba586e28a26
---
graph TB
    subgraph "App Entry"
        A[main.tsx]
    end

    subgraph "Routing Layer"
        B[routes.tsx]
        B1[Public Routes]
        B2[Protected Admin Routes]
        B3[Protected Student Routes]
    end

    subgraph "Context Layer"
        C[AuthContext.tsx]
        D[AppContext.tsx]
    end

    subgraph "Layout Components"
        E[Layout.tsx]
        E1[Sidebar Navigation]
        E2[Header]
        E3[Footer]
    end

    subgraph "Admin Pages"
        F[AdminDashboard.tsx]
        G[AdminRoles.tsx]
        H[UniversitiesList]
        I[StudentManagement]
        J[RegistrationManagement]
    end

    subgraph "RBAC Components"
        K[PermissionGuard.tsx]
        L[PermissionRoute.tsx]
        M[rbac.ts Constants]
    end

    subgraph "Reusable Components"
        N[UniversityForm.tsx]
        O[EditUniversityModal.tsx]
        P[ImportUniversitiesModal.tsx]
        Q[AdminInvite.tsx]
    end

    A --> B
    B --> C
    B --> D
    B --> E
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
    
    F --> K
    G --> K
    H --> K
    
    K --> M
    L --> M
    
    H --> N
    H --> O
    H --> P
    G --> Q
```

## 3. Backend API Architecture

```mermaid
---
id: f8bf45ad-0439-4e56-9583-b0119540b0ba
---
graph LR
    subgraph "Express Server"
        A[server.js]
    end

    subgraph "Middleware Stack"
        B[CORS Middleware]
        B1[Multi-Origin Support]
        C[JSON Parser]
        D[Authentication Middleware]
        E[RBAC Middleware]
    end

    subgraph "Route Modules"
        F[auth.js]
        G[universities.js]
        H[registrations.js]
        I[students.js]
        J[adminInvite.js]
    end

    subgraph "Database Access"
        K[pg Pool]
        K1[app.locals.pool]
        L[SQL Queries]
    end

    A --> B
    B --> B1
    B --> C
    B --> D
    C --> D
    D --> E
    
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
    
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
    
    K --> K1
    K --> L
```

## 4. Database Schema (ER Diagram)

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK
        string name
        string password_hash
        enum role "admin|super_admin|admin_manager|content_editor|finance_admin|viewer"
        string phone
        string setup_token
        timestamp setup_token_expiry
        timestamp created_at
        timestamp updated_at
    }

    UNIVERSITIES {
        uuid id PK
        string name
        string korean_name
        string region
        string hero_image
        string thumbnail
        jsonb korean_data
        timestamp created_at
        timestamp updated_at
    }

    REGISTRATIONS {
        uuid id PK
        uuid student_id FK
        uuid university_id FK
        enum status "pending|approved|rejected"
        jsonb form_data
        timestamp created_at
        timestamp updated_at
    }

    STUDENT_PROGRESS {
        uuid id PK
        uuid student_id FK
        uuid registration_id FK
        enum stage "document|application|interview|visa|departure"
        jsonb progress_data
        timestamp created_at
        timestamp updated_at
    }

    INVITATIONS {
        uuid id PK
        string email UK
        string name
        string role
        string invited_by FK
        string setup_token
        timestamp setup_token_expiry
        timestamp created_at
        boolean used
    }

    USERS ||--o{ REGISTRATIONS : "makes"
    USERS ||--o{ STUDENT_PROGRESS : "has"
    USERS ||--o{ INVITATIONS : "invited_by"
    UNIVERSITIES ||--o{ REGISTRATIONS : "receives"
    REGISTRATIONS ||--o{ STUDENT_PROGRESS : "tracks"
```

## 5. RBAC Permission Structure

```mermaid
graph TB
    subgraph "Roles Hierarchy"
        A[super_admin] -->|inherits| B[admin]
        B --> C[admin_manager]
        B --> D[content_editor]
        B --> E[finance_admin]
        B --> F[viewer]
    end

    subgraph "super_admin / admin Permissions"
        SA1[*]
    end

    subgraph "admin_manager Permissions"
        AM1[university:view]
        AM2[student:view/edit/progress]
        AM3[application:view/manage]
        AM4[payment:view]
        AM5[analytics:view]
    end

    subgraph "content_editor Permissions"
        CE1[university:view/create/edit]
        CE2[student:view]
        CE3[application:view]
    end

    subgraph "finance_admin Permissions"
        FA1[university:view]
        FA2[student:view]
        FA3[application:view]
        FA4[payment:view/create/approve]
        FA5[analytics:view]
    end

    subgraph "viewer Permissions"
        V1[university:view]
        V2[student:view]
        V3[application:view]
        V4[payment:view]
        V5[analytics:view]
    end

    A --> SA1
    B --> SA1
    C --> AM1
    C --> AM2
    C --> AM3
    C --> AM4
    C --> AM5
    D --> CE1
    D --> CE2
    D --> CE3
    E --> FA1
    E --> FA2
    E --> FA3
    E --> FA4
    E --> FA5
    F --> V1
    F --> V2
    F --> V3
    F --> V4
    F --> V5
```

## 6. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant JWT

    User->>Frontend: Enter credentials
    Frontend->>Backend: POST /api/login
    Backend->>Database: SELECT user by email
    Database-->>Backend: user data
    Backend->>Backend: Verify password
    Backend->>JWT: Generate token
    JWT-->>Backend: token
    Backend-->>Frontend: {token, user}
    Frontend->>Frontend: Store token (localStorage)
    Frontend->>Frontend: Decode role from token
    Frontend->>Frontend: Render UI based on role
    User->>Frontend: Access protected route
    Frontend->>Backend: Request with Authorization header
    Backend->>JWT: Verify token
    JWT-->>Backend: decoded payload
    Backend->>Backend: Check permissions
    Backend->>Database: Execute query
    Database-->>Backend: Results
    Backend-->>Frontend: Response data
    Frontend-->>User: Display data
```

## 7. Admin Invite Flow

```mermaid
sequenceDiagram
    participant Admin
    participant Frontend
    participant Backend
    participant Database
    participant Email

    Admin->>Frontend: Fill invite form (email, name, role)
    Frontend->>Backend: POST /api/admin/invite
    Backend->>Backend: Check Admin permissions
    Backend->>Backend: Generate setup_token
    Backend->>Database: INSERT INTO invitations
    Database-->>Backend: Success
    Backend->>Database: INSERT INTO users (pending)
    Database-->>Backend: Success
    Backend-->>Frontend: {success, setupUrl}
    Frontend-->>Admin: Display invite link
    Admin->>NewUser: Share setup link
    NewUser->>Frontend: Click setup link
    Frontend->>Backend: GET /api/admin/verify-setup?token=xxx
    Backend->>Database: Verify token
    Database-->>Backend: Valid
    Backend-->>Frontend: {valid, email}
    NewUser->>Frontend: Set password
    Frontend->>Backend: POST /api/admin/setup-password
    Backend->>Backend: Hash password
    Backend->>Database: UPDATE users SET password, clear token
    Database-->>Backend: Success
    Backend-->>Frontend: {success}
    Frontend-->>NewUser: Redirect to login
```

## 8. Data Flow - University Management

```mermaid
flowchart TD
    A[Admin User] -->|1. Access Universities Page| B[UniversitiesList Component]
    B -->|2. Fetch Request| C[universityApi.ts]
    C -->|3. GET /api/universities| D[Backend API]
    D -->|4. Authenticate Token| E[Auth Middleware]
    E -->|5. Check Permission| F[RBAC Middleware]
    F -->|6. Query| G[PostgreSQL]
    G -->|7. Return Data| D
    D -->|8. JSON Response| C
    C -->|9. Update State| B
    B -->|10. Render List| A

    A -->|11. Click Add| H[UniversityForm Modal]
    H -->|12. Submit| C
    C -->|13. POST /api/universities| D
    D -->|14. Validate & Insert| G
    G -->|15. Return ID| D
    D -->|16. Success| C
    C -->|17. Refresh List| B
```

## 9. Component Class Diagram (Simplified)

```mermaid
classDiagram
    class AuthProvider {
        +User user
        +boolean isAdmin
        +login(email, password)
        +logout()
        +hasPermission(permission)
    }

    class AppProvider {
        +Array universities
        +Array students
        +Array registrations
        +addUniversity(data)
        +updateUniversity(id, data)
        +deleteUniversity(id)
    }

    class Layout {
        +boolean sidebarCollapsed
        +Array menuItems
        +renderSidebar()
        +handleLogout()
    }

    class PermissionGuard {
        +string permission
        +ReactNode children
        +ReactNode fallback
        +checkPermission()
        +render()
    }

    class AdminInvite {
        +Array invitedUsers
        +boolean showInviteForm
        +inviteUser(data)
        +resendInvite(id)
        +fetchInvitedUsers()
    }

    class UniversitiesList {
        +Array universities
        +string searchQuery
        +boolean showAddModal
        +handleSearch(query)
        +handleAdd(university)
        +handleEdit(id, data)
        +handleDelete(id)
    }

    AuthProvider --> Layout : provides auth state
    AppProvider --> UniversitiesList : provides data
    AuthProvider --> PermissionGuard : provides permission check
    Layout --> AdminInvite : contains
    Layout --> UniversitiesList : contains
```

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        A[localhost:5173 - Vite Dev]
        B[localhost:3001 - Node Dev]
        C[Local PostgreSQL or Supabase]
        D1[npm run dev:full]
        D2[Auto-start Script]
        D3[Port 3001 Killer]
    end

    subgraph "Production Environment"
        D[Vercel - Static Hosting]
        E[Render - Node Server]
        F[Supabase - PostgreSQL]
    end

    subgraph "CDN & DNS"
        G[Cloudflare DNS]
        H[Vercel Edge Network]
    end

    D1 --> D2
    D2 --> D3
    D3 --> B
    D2 --> A
    
    A -->|git push| D
    B -->|git push| E
    C -.->|migrate| F

    D --> H
    H --> G
    E --> F
    D --> E

    style D fill:#00C853,stroke:#00C853,color:#fff
    style E fill:#00BFA5,stroke:#00BFA5,color:#fff
    style F fill:#2979FF,stroke:#2979FF,color:#fff
    style D1 fill:#FF9800,stroke:#FF9800,color:#fff
```

## 11. File Structure

```
project/
├── src/
│   ├── app/
│   │   ├── components/          # UI Components
│   │   │   ├── Layout.tsx
│   │   │   ├── PermissionGuard.tsx
│   │   │   ├── UniversitiesList.tsx
│   │   │   ├── UniversityForm.tsx
│   │   │   ├── AdminInvite.tsx
│   │   │   └── ...
│   │   ├── pages/               # Page Components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminRoles.tsx
│   │   │   ├── StudentPortal.tsx
│   │   │   └── ...
│   │   ├── context/             # React Context
│   │   │   ├── AuthContext.tsx
│   │   │   └── AppContext.tsx
│   │   ├── constants/           # Constants & Config
│   │   │   └── rbac.ts
│   │   ├── services/            # API Services
│   │   │   ├── api.ts
│   │   │   ├── universityApi.ts
│   │   │   └── authApi.ts
│   │   ├── routes.tsx           # Route Configuration
│   │   └── types.ts             # TypeScript Types
│   └── main.tsx                 # App Entry Point
├── server/                       # Backend
│   ├── server.js                # Main Server
│   ├── routes/                  # API Routes
│   ├── package.json
│   └── .env
├── docs/                        # Documentation
│   └── ARCHITECTURE_UML.md      # This file
└── package.json
```

## 12. API Endpoints Summary

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | /api/login | Public | User authentication |
| POST | /api/logout | Public | User logout |
| GET | /api/universities | Public (no auth) | List all universities |
| POST | /api/universities | university:create | Create university |
| PUT | /api/universities/:id | university:edit | Update university |
| DELETE | /api/universities/:id | university:delete | Delete university |
| GET | /api/registrations | application:view | List registrations |
| POST | /api/admin/invite | manage:user | Invite new admin |
| GET | /api/admin/verify-setup | Public | Verify setup token |
| POST | /api/admin/setup-password | Public | Set initial password |

---

**Generated**: Architecture documentation for Du Học Cost Management System
**Tech Stack**: React + TypeScript + Vite + Node.js + Express + PostgreSQL + Supabase
