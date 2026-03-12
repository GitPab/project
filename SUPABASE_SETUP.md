# Supabase Setup Guide for SACMA Tracking Codes

## Overview

SACMA uses Supabase to persistently store tracking codes. This allows students to access their information from any device using their unique tracking code.

## Prerequisites

- Supabase account (free tier available: https://supabase.com)
- Git for version control (to store environment variables securely)

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up (or log in)
2. Click "New Project"
3. Select an organization
4. Fill in:
   - Project Name: `sacma-tracking`
   - Database Password: Create a strong password (save it)
   - Region: Choose closest to your users (Asia-Southeast1 for Vietnam/Korea)
5. Click "Create new project" (takes ~2-3 minutes)

## Step 2: Get API Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: Looks like `https://xxxxx.supabase.co`
   - **anon public**: Your anonymous key (for client-side) - look under "Project API keys"

## Step 3: Create Tracking Codes Table

1. Go to **SQL Editor** in Supabase
2. Click **New Query**
3. Paste the following SQL:

```sql
-- Create tracking_codes table
CREATE TABLE tracking_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) UNIQUE NOT NULL,
  student_email VARCHAR(255),
  student_name VARCHAR(255),
  student_phone VARCHAR(20),
  desired_university_id VARCHAR(255),
  desired_university_name VARCHAR(255),
  visa_system VARCHAR(50),
  topik_level VARCHAR(10),
  ielts_score VARCHAR(10),
  initial_total_cost_vnd BIGINT,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for faster lookups
CREATE INDEX idx_tracking_code ON tracking_codes(code);
CREATE INDEX idx_student_email ON tracking_codes(student_email);
CREATE INDEX idx_created_at ON tracking_codes(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tracking_codes_updated_at BEFORE UPDATE ON tracking_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. Click **Run** to execute

## Step 4: Set Up Row Level Security (RLS)

1. Go to **SQL Editor** again, create new query:

```sql
-- Enable RLS on tracking_codes table
ALTER TABLE tracking_codes ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can INSERT (students creating codes)
CREATE POLICY "Enable insert for all users" ON tracking_codes
  FOR INSERT
  WITH CHECK (true);

-- Policy 2: Everyone can SELECT if they know the full code
CREATE POLICY "Enable select for code lookup" ON tracking_codes
  FOR SELECT
  USING (true);  -- In production, could restrict by code column

-- Policy 3: Only authenticated OR admins can UPDATE
-- (For now, we'll skip UPDATE policies - implement when admin auth is added)
```

2. Click **Run**

## Step 5: Set Environment Variables

1. In your project root, create `.env.local`:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. **Important**: Add `.env.local` to `.gitignore` to protect credentials

```bash
echo ".env.local" >> .gitignore
```

## Step 6: Install Supabase Client (Optional - For Now)

The app currently uses a mock implementation. To connect to real Supabase:

```bash
npm install @supabase/supabase-js
```

Then update `src/config/supabase.ts` to use real client (commented code included).

## Step 7: Test the Setup

1. Start the app: `npm run dev`
2. Go to Public Onboarding page (`/`)
3. Fill out the form and submit
4. You should see a tracking code generated
5. Check Supabase **Table Editor** → `tracking_codes` to confirm data is saved

## Troubleshooting

### Code not saving?
- Check `.env.local` has correct URL and key
- Check browser console for errors
- Verify Supabase project is active (check dashboard)

### Can't retrieve codes?
- Ensure RLS policies are set correctly
- Check that code exists in `tracking_codes` table
- Look at browser network tab (DevTools) to see API responses

### Getting 401 Unauthorized?
- Check API key is correct (not just the JWT secret)
- Make sure using `anon` key, not service role key
- Verify project URL matches `.env.local`

## Database Schema Summary

```
tracking_codes table:
├── id (UUID) - Primary key
├── code (VARCHAR 255, UNIQUE) - Format: SACMA-YYYYMMDD-XXXXXX
├── student_email, student_name, student_phone
├── desired_university_id, desired_university_name
├── visa_system (D4-1, D2-2, etc)
├── topik_level (0-6)
├── ielts_score (optional)
├── initial_total_cost_vnd (BIGINT)
├── status (pending/in-review/approved/contacted)
├── notes (TEXT)
├── created_at, updated_at (TIMESTAMP WITH TIMEZONE)
```

## Next Steps

1. Connect real Supabase client in `src/config/supabase.ts`
2. Test tracking code lookup on Student Tracking page
3. Add admin viewing of all tracking codes
4. Implement email notifications when codes are used

## Testing Commands

```bash
# View all codes in Supabase console
SELECT * FROM tracking_codes ORDER BY created_at DESC;

# Find codes by student email
SELECT * FROM tracking_codes WHERE student_email LIKE '%@example.com%';

# Count total codes created today
SELECT COUNT(*) FROM tracking_codes WHERE DATE(created_at) = TODAY();
```

## Security Notes

- 🔒 Never commit `.env.local` to Git
- 🔑 Rotate API keys if compromised
- 📱 Use RLS policies to restrict data access
- 🛡️ In production, add proper authentication for admin functions
