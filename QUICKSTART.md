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

## Step 2: Set Up Neon Database (2 minutes)

**Recommended**: Use Neon for easy setup and free tier

1. Go to [Neon](https://neon.tech) and sign up (free tier available)
2. Create a new project
3. Copy your connection string (looks like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)
4. **Important**: Do NOT enable Neon's built-in auth - this app handles authentication separately

**Alternative**: You can use any PostgreSQL database provider:
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- Local PostgreSQL

## Step 3: Configure Environment (1 minute)

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

### Required for Basic Functionality:
```env
# Your Neon connection string
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Generate a secret (run this command):
# openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

**Note**: Authentication is currently disabled for testing. The app works without OAuth credentials.

### Optional (for future use):
OAuth and email are currently disabled for testing. You can set these up later:

**Google OAuth** (when re-enabling auth):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth credentials
5. Add to `.env.local`:
```env
GOOGLE_CLIENT_ID="your-id-here"
GOOGLE_CLIENT_SECRET="your-secret-here"
```

**GitHub OAuth** (when re-enabling auth):
1. Go to [GitHub Settings > Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Add to `.env.local`:
```env
GITHUB_ID="your-id-here"
GITHUB_SECRET="your-secret-here"
```

**Resend for Emails** (optional):
1. Sign up at [Resend](https://resend.com)
2. Get API key
3. Add to `.env.local`:
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

1. **Calendar Dashboard**: Beautiful calendar interface (no sign-in required for testing)
2. **Create Events**: Click on any empty day to create an event starting on that day
3. **View Event Details**: Click on any event to see full details, edit, or delete
4. **Manage Contacts**: CRM for managing your contacts

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
- Authentication is currently disabled for testing, so OAuth errors won't occur
- If you re-enable auth, verify OAuth callback URLs match:
  - Google: `http://localhost:3000/api/auth/callback/google`
  - GitHub: `http://localhost:3000/api/auth/callback/github`

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