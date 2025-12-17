# Quick Start Guide - AI Calendar Application

Get your AI Calendar app running in 5 minutes!

## Prerequisites

Before you begin, make sure you have:
- Node.js 20+ installed
- PostgreSQL database (local or cloud)
- Git installed

## Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd cursor-cloud-agent-tests

# Install dependencies
npm install
```

## Step 2: Set Up Database (1 minute)

### Option A: Local PostgreSQL
```bash
# Start PostgreSQL locally
# Then create a database
createdb ai_calendar
```

### Option B: Cloud Database
Use any PostgreSQL provider:
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (Recommended)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)
- [Neon](https://neon.tech)

## Step 3: Configure Environment (1 minute)

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and add your credentials:

### Required for Basic Functionality:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ai_calendar"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### Optional (but recommended):
Get OAuth credentials for sign-in:

**Google OAuth** (5 min setup):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth credentials
5. Add to `.env`:
```env
GOOGLE_CLIENT_ID="your-id-here"
GOOGLE_CLIENT_SECRET="your-secret-here"
```

**GitHub OAuth** (2 min setup):
1. Go to [GitHub Settings > Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Add to `.env`:
```env
GITHUB_ID="your-id-here"
GITHUB_SECRET="your-secret-here"
```

**Resend for Emails** (2 min setup):
1. Sign up at [Resend](https://resend.com)
2. Get API key
3. Add to `.env`:
```env
RESEND_API_KEY="re_your-key-here"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

## Step 4: Initialize Database (30 seconds)

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

## Step 5: Run the App! (10 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser! 🎉

## What You'll See

1. **Sign In Page**: OAuth login with Google/GitHub
2. **Calendar View**: Beautiful calendar interface
3. **Events**: Create and manage calendar events
4. **Contacts**: CRM for managing your contacts

## Quick Tips

### View Your Database
```bash
npx prisma studio
```
Opens a GUI to view/edit your database at http://localhost:5555

### Check Build
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Troubleshooting

### "Database connection failed"
- Check your DATABASE_URL is correct
- Ensure PostgreSQL is running
- Verify database exists

### "Build failed"
- Run `npx prisma generate` first
- Check all environment variables are set
- Ensure Node.js version is 20+

### "OAuth error"
- Verify OAuth callback URLs match:
  - Google: `http://localhost:3000/api/auth/callback/google`
  - GitHub: `http://localhost:3000/api/auth/callback/github`
- Check client IDs and secrets are correct

## Next Steps

1. **Customize**: Update branding, colors, and features
2. **Add Data**: Create events and contacts
3. **Deploy**: Deploy to Vercel or your preferred platform
4. **Extend**: Add AI features, integrations, or new capabilities

## Need Help?

- Check [DEVELOPMENT.md](DEVELOPMENT.md) for detailed documentation
- Review [README.md](README.md) for comprehensive setup guide
- Open an issue on GitHub

---

Happy coding! 🚀