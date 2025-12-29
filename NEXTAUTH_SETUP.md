# NextAuth Setup Guide

This guide will walk you through setting up NextAuth.js authentication for your calendar application.

## Prerequisites

- ✅ NextAuth is already configured in `lib/auth.ts`
- ✅ Database schema includes User, Account, Session, and VerificationToken models
- ✅ API routes are already set up to use authentication

## Step 1: Set Up OAuth Providers

You need to set up at least one OAuth provider. Choose one or both:

### Option A: Google OAuth (Recommended)

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Give it a name (e.g., "AI Calendar")
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "People API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - If prompted, configure the OAuth consent screen:
     - User Type: External (for testing) or Internal (for Google Workspace)
     - App name: "AI Calendar"
     - User support email: Your email
     - Developer contact: Your email
     - Click "Save and Continue"
     - Scopes: Keep defaults, click "Save and Continue"
     - Test users: Add your email, click "Save and Continue"
     - Click "Back to Dashboard"
   - Application type: "Web application"
   - Name: "AI Calendar Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Click "Create"
   - **Copy the Client ID and Client Secret**

5. **Add to `.env.local`**
   ```env
   GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret-here"
   ```

### Option B: GitHub OAuth

1. **Go to GitHub Developer Settings**
   - Visit [https://github.com/settings/developers](https://github.com/settings/developers)
   - Click "New OAuth App"

2. **Create OAuth App**
   - Application name: "AI Calendar"
   - Homepage URL: `http://localhost:3000` (or your production URL)
   - Authorization callback URL:
     - `http://localhost:3000/api/auth/callback/github` (for development)
     - `https://yourdomain.com/api/auth/callback/github` (for production)
   - Click "Register application"

3. **Get Credentials**
   - You'll see the Client ID immediately
   - Click "Generate a new client secret" to get the secret
   - **Copy both the Client ID and Client Secret**

4. **Add to `.env.local`**
   ```env
   GITHUB_ID="your-github-client-id"
   GITHUB_SECRET="your-github-client-secret"
   ```

## Step 2: Configure Environment Variables

Make sure your `.env.local` file has all required variables:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# NextAuth (Required)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (At least one required)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OR

GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and add it to your `.env.local` file.

## Step 3: Update NEXTAUTH_URL for Production

When deploying to production, update `NEXTAUTH_URL`:

```env
NEXTAUTH_URL="https://yourdomain.com"
```

And make sure your OAuth provider redirect URIs match your production URL.

## Step 4: Verify Database Schema

The database schema already includes all necessary tables. If you haven't run migrations yet:

```bash
npx prisma generate
npx prisma db push
```

This creates:
- `User` table
- `Account` table (for OAuth providers)
- `Session` table
- `VerificationToken` table

## Step 5: Test Authentication

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Visit the app**
   - Go to `http://localhost:3000`
   - You should be redirected to `/auth/signin`

3. **Sign in**
   - Click on "Sign in with Google" or "Sign in with GitHub"
   - Complete the OAuth flow
   - You should be redirected back to the calendar dashboard

## Troubleshooting

### "Invalid credentials" error

- Double-check your Client ID and Client Secret in `.env.local`
- Make sure there are no extra spaces or quotes
- Restart your development server after changing `.env.local`

### "Redirect URI mismatch" error

- Verify the redirect URI in your OAuth provider settings matches exactly:
  - Development: `http://localhost:3000/api/auth/callback/google` (or `/github`)
  - Production: `https://yourdomain.com/api/auth/callback/google` (or `/github`)
- Make sure `NEXTAUTH_URL` matches your current URL

### "NEXTAUTH_SECRET is missing" error

- Make sure `NEXTAUTH_SECRET` is set in `.env.local`
- Generate a new secret with `openssl rand -base64 32`
- Restart your development server

### "Database error" during sign-in

- Make sure your database is running and accessible
- Verify `DATABASE_URL` is correct
- Run `npx prisma db push` to ensure all tables exist

### OAuth provider not showing up

- Check that the environment variables are set correctly
- Make sure the provider is enabled in `lib/auth.ts`
- Restart your development server

## Current Configuration

Your NextAuth is configured in `lib/auth.ts` with:

- **Adapter**: PrismaAdapter (stores sessions in database)
- **Providers**: Google and GitHub
- **Sign-in page**: `/auth/signin`
- **Session callback**: Adds user ID to session

## Security Notes

- Never commit `.env.local` to git (it's in `.gitignore`)
- Use different OAuth apps for development and production
- Rotate `NEXTAUTH_SECRET` if it's ever exposed
- Use HTTPS in production

## Next Steps

Once authentication is working:

1. Users will be automatically created on first sign-in
2. All events and contacts will be scoped to the signed-in user
3. Sessions are stored in the database and persist across server restarts
4. Users can sign out using the sign-out button

---

**Need help?** Check the [NextAuth.js documentation](https://next-auth.js.org/) for more details.



