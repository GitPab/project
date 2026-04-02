# Changelog

All notable changes to the SACMA project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-04-02

### 🎉 Major Release - API Integration & Project Organization

#### ✨ New Features (10 New API Modules)

- **Payment Management System**
  - Complete payment tracking and management
  - Support for multiple currencies (VND, USD, KRW, JPY, CNY)
  - Payment status workflow (pending, completed, failed, refunded)
  - Student payment summary endpoint
  - Admin payment creation and management

- **Student Profiles**
  - Extended student information storage
  - Education history and preferences
  - Language proficiency tracking
  - Profile management for students and admins

- **Notification System**
  - Real-time notifications via SSE
  - Multiple notification types (payment, document, appointment, system, message)
  - Unread count and bulk operations
  - Admin broadcast capability

- **Document Management**
  - File upload and storage
  - Document review workflow
  - Multiple document types (passport, transcript, certificate, etc.)
  - Review status tracking (pending, approved, rejected, needs_revision)

- **Programs Management**
  - Study program CRUD operations
  - University-program relationship
  - Public listing and admin management

- **Internal Messaging**
  - Student-admin communication
  - Inbox and sent message tracking
  - Soft delete functionality

- **Appointment Scheduling**
  - Calendar-based appointment system
  - Available time slots
  - Appointment status management
  - Cancellation and rescheduling

- **Scholarship System**
  - Scholarship listing and applications
  - Application review workflow
  - Student application tracking
  - Admin management interface

- **Visa Application Tracking**
  - Visa application CRUD
  - Status tracking through embassy process
  - Multiple visa types (D-2, D-4, D-4-1, D-2-2, D-2-3)
  - Admin status updates

- **User Preferences**
  - Language preference (vi, ko, en)
  - Theme settings (light, dark, auto)
  - Currency preference
  - Notification settings

#### 🔌 API Infrastructure

- **22 Total API Routes** (up from 7)
  - 7 Core routes (auth, universities, students, registrations, public, health, database)
  - 10 Feature routes (payments, profiles, notifications, documents, programs, messages, appointments, scholarships, visa, preferences)
  - 5 Utility routes (uploads, features, admin-invite, media, exchange-rates)

- **Real-time Updates**
  - SSE (Server-Sent Events) implementation
  - Live registration updates
  - Connection resilience with auto-reconnect
  - Heartbeat mechanism

- **Offline-First Architecture**
  - Local SQLite database
  - Queue system for offline changes
  - Background synchronization
  - Conflict resolution

#### 🏗️ Project Organization

- **Feature-Based Structure**
  - Reorganized frontend into feature modules
  - `src/app/features/` - Domain-based organization
  - Clean separation of concerns
  - Easier navigation and maintenance

- **Server Structure**
  - `server/src/` directory for better organization
  - Separate config, middleware, services, utils
  - Clear module boundaries

- **Documentation**
  - `docs/` directory with comprehensive documentation
  - Architecture diagrams
  - API reference (complete endpoint documentation)
  - Project structure documentation
  - Maintainability guide

#### 🧹 Code Cleanup

- **Removed 8 Duplicate/Old Files**
  - `server/cache.ts` → using `server/cache.js`
  - `server/logger.ts` → using `server/logger.js`
  - `server/poolMonitor.ts` → using `server/poolMonitor.js`
  - `server/email.ts` → using `server/email.js`
  - `server/csvSanitizer.ts` → using `server/csvSanitizer.js`
  - `server/server-old.js` → archived
  - `server/server-pg.js` → archived
  - `server/query` → removed (junk file)

#### 🔐 Security & Performance

- **RBAC Implementation**
  - Role-based access control (student, staff, admin)
  - Permission checking middleware
  - Route-level authorization

- **Rate Limiting**
  - API rate limiting per endpoint type
  - Prevents abuse and ensures stability

- **Input Validation**
  - Consistent validation across all endpoints
  - UUID format validation
  - Error handling standardization

#### 📚 Documentation Updates

- **README.md**
  - Updated to v2.0.0
  - Complete feature list
  - New environment variables
  - Updated project structure
  - API endpoint summary

- **API Documentation**
  - `docs/api/API_REFERENCE.md` - Complete API documentation
  - All 22 routes documented
  - Request/response examples
  - Authentication details
  - Error codes reference

- **Project Structure**
  - `docs/PROJECT_STRUCTURE.md` - Updated with v2.0 changes
  - Phase 12 & 13 documentation
  - Statistics updated (22 API routes)

- **Architecture**
  - `docs/architecture/README.md` - System architecture docs
  - Data flow diagrams
  - Component relationships

#### 🛠️ Developer Experience

- **Index Files**
  - Clean exports from feature modules
  - Easier imports: `import { Button, Modal } from '@/app/shared/components'`
  - Consistent naming conventions

- **Type Safety**
  - All new APIs use TypeScript types
  - Consistent error handling
  - Proper type exports

#### 🐛 Bug Fixes

- Fixed university detail API 500 error
- Fixed navigation issues between student and admin pages
- Fixed layout rendering based on user roles
- Fixed import path inconsistencies

#### ⚡ Performance Improvements

- Database connection pooling
- Redis caching (optional)
- Optimized queries with proper indexing
- SSE instead of polling for real-time updates

---

## [1.0.0] - 2026-03-12

### 🎉 Initial Release

#### ✨ Core Features

- **Student Tracking System**
  - Unique tracking code generation (SACMA-YYYYMMDD-XXXXXX)
  - Email-based tracking lookup
  - Public tracking page

- **Cost Management**
  - VND-based pricing (base currency)
  - Multi-currency support (USD, KRW, JPY, CNY)
  - Real-time exchange rates
  - Cost calculator

- **Admin Dashboard**
  - Student registration monitoring
  - Cost tracking and management
  - User management

- **Multilingual Support**
  - Vietnamese (default)
  - Korean
  - English (fallback)

- **Public Onboarding**
  - No login required for registration
  - Clean registration flow
  - Success confirmation

#### 🏗️ Initial Structure

- React 18 + TypeScript frontend
- Node.js + Express backend
- Supabase integration (PostgreSQL + Auth)
- Vite build tool
- Tailwind CSS styling

#### 📚 Documentation

- Basic README.md
- Deployment guides
- Supabase setup guide

---

## Release History Summary

| Version | Date | Key Changes |
|---------|------|-------------|
| 2.0.0 | 2026-04-02 | 15 new APIs, feature organization, code cleanup |
| 1.0.0 | 2026-03-12 | Initial release with core features |

---

## Migration Guide

### From 1.0.0 to 2.0.0

1. **Database Migration**
   ```bash
   cd server
   npm run migrate
   ```

2. **Environment Variables**
   Add to `server/.env`:
   ```env
   JWT_SECRET=your-secret-key
   REDIS_URL=redis://localhost:6379  # optional
   ```

3. **Dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

4. **Restart Services**
   ```bash
   # Restart backend
   cd server && npm start
   
   # Restart frontend
   npm run dev
   ```

---

## Future Roadmap

### Version 2.1.0 (Planned)
- [ ] Email notification system
- [ ] SMS notifications
- [ ] Advanced analytics dashboard
- [ ] PDF report generation

### Version 2.2.0 (Planned)
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] AI-powered recommendations

### Version 3.0.0 (Planned)
- [ ] Multi-tenant support
- [ ] White-label solution
- [ ] API marketplace
- [ ] Advanced integrations

---

**Contributors:** SACMA Development Team  
**License:** Proprietary  
**Repository:** [Private Repository]
