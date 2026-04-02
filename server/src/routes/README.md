/**
 * API Routes Organization
 * 
 * ## Route Files (22 total)
 * 
 * ### Core Routes (7)
 * - auth.js          - Authentication (login, register, verify)
 * - universities.js  - University CRUD + bulk import
 * - students.js      - Student management
 * - registrations.js - Registration CRUD + SSE
 * - public.js        - Public access endpoints
 * - health.js        - Health checks
 * - database.js      - Admin DB operations
 * 
 * ### Feature Routes (10) - NEW
 * - payments.js         - Financial transactions
 * - studentProfiles.js  - Extended student info
 * - notifications.js    - System notifications
 * - documents.js        - File uploads
 * - programs.js         - Study programs
 * - messages.js         - Internal messaging
 * - appointments.js     - Calendar scheduling
 * - scholarships.js     - Scholarships + applications
 * - visaApplications.js - Visa tracking
 * - userPreferences.js  - User settings
 * 
 * ### Utility Routes (5)
 * - uploads.js       - File upload handling
 * - features.js      - Feature flags
 * - adminInvite.js   - Admin invitation
 * - media.js         - Media management
 * - exchangeRates.js - Currency conversion
 * 
 * ## Route Registration Order (in server.js)
 * 1. Auth routes (public)
 * 2. Core data routes (universities, students, registrations)
 * 3. Feature routes (payments, messages, etc.)
 * 4. Utility routes (uploads, media, etc.)
 * 5. SSE endpoint (real-time)
 */

export {};
