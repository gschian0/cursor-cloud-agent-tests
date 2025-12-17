# AI Calendar Application - Development Guide

## Overview

This is a modern, full-stack calendar application with integrated CRM capabilities, built using the latest web technologies optimized for the Cursor and GitHub AI Cloud stack.

## Technology Stack

### Core Framework
- **Next.js 16.0.10** - React framework with App Router
- **React 19.2.1** - UI library
- **TypeScript 5** - Type-safe JavaScript

### Database & ORM
- **PostgreSQL** - Relational database
- **Prisma 7.2.0** - Next-generation ORM
- **@prisma/adapter-pg** - PostgreSQL adapter for Prisma 7

### Authentication
- **NextAuth.js v5 (beta)** - Authentication solution
- **@auth/prisma-adapter** - Prisma adapter for NextAuth
- Supports Google OAuth and GitHub OAuth

### Email
- **Resend** - Modern email API for transactional emails

### UI Components
- **Tailwind CSS v4** - Utility-first CSS framework
- **react-big-calendar** - Full-featured calendar component
- **Lucide React** - Beautiful icon library
- **Radix UI** - Headless UI primitives
- **date-fns** - Modern date utility library

## Key Features

### 1. Calendar Management
- Full calendar view (month, week, day, agenda)
- Create, view, and manage events
- Color-coded events
- All-day event support
- Event descriptions and locations
- Date/time picker integration

### 2. CRM (Contact Relationship Management)
- Contact management with detailed information
- Track company, position, phone, email
- Tag-based organization
- Notes field for additional information
- Link contacts to calendar events

### 3. Authentication & Authorization
- Secure OAuth authentication
- Google and GitHub sign-in
- Session management
- User-specific data isolation

### 4. Email Notifications
- Event reminders via Resend
- Customizable email templates
- Automatic event notifications

## Database Schema

### User Model
- Authentication information
- Profile data
- Relations to events and contacts

### Event Model
- Calendar event details
- Date/time information
- Location and description
- Color coding
- User and contact relations

### Contact Model
- Personal information
- Company and position
- Tags for organization
- Notes
- User relations

### Authentication Models
- Account (OAuth providers)
- Session
- VerificationToken

## API Routes

### `/api/auth/[...nextauth]`
- NextAuth authentication endpoints
- Handles OAuth flows

### `/api/events`
- GET: Fetch all user events
- POST: Create new event

### `/api/contacts`
- GET: Fetch all user contacts
- POST: Create new contact

## Environment Setup

Required environment variables:

```
DATABASE_URL - PostgreSQL connection string
NEXTAUTH_URL - Application URL
NEXTAUTH_SECRET - Secret for session encryption
GOOGLE_CLIENT_ID - Google OAuth credentials
GOOGLE_CLIENT_SECRET - Google OAuth credentials
GITHUB_ID - GitHub OAuth credentials
GITHUB_SECRET - GitHub OAuth credentials
RESEND_API_KEY - Resend API key
RESEND_FROM_EMAIL - Sender email address
```

## Development Workflow

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Database Setup
```bash
# Push schema to database
npx prisma db push

# Or run migrations (production)
npx prisma migrate dev
```

### 5. Run Development Server
```bash
npm run dev
```

### 6. Build for Production
```bash
npm run build
npm start
```

## Code Organization

### `/app`
- Next.js App Router pages and layouts
- API routes
- Client components for main dashboard

### `/components`
- Reusable React components
- Calendar UI
- Modal components
- Contact lists

### `/lib`
- Utility functions
- Database client
- Authentication configuration
- Email utilities

### `/prisma`
- Database schema
- Migrations (when using migrate)

## Best Practices

### Type Safety
- Full TypeScript coverage
- Prisma generates types automatically
- Strict type checking enabled

### Database
- Use Prisma Client for all database operations
- Leverage relations for complex queries
- Index frequently queried fields

### Authentication
- Server-side session validation
- Protected API routes
- Redirect unauthenticated users

### UI/UX
- Responsive design with Tailwind
- Loading states for async operations
- Error handling and user feedback

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Configure environment variables
3. Vercel auto-detects Next.js
4. Set up PostgreSQL database (Vercel Postgres or external)

### Other Platforms
- Railway
- Render
- AWS Amplify
- Netlify

All platforms require:
- Node.js 20+
- PostgreSQL database
- Environment variables configured

## Troubleshooting

### Build Issues
- Ensure all environment variables are set
- Run `npx prisma generate` before building
- Check Node.js version compatibility

### Database Connection
- Verify DATABASE_URL format
- Ensure database is accessible
- Check firewall/network settings

### Authentication
- Verify OAuth callback URLs
- Check OAuth credentials
- Ensure NEXTAUTH_SECRET is set

## Future Enhancements

Potential features to add:
- AI-powered event suggestions
- Calendar sharing
- Recurring events
- Event reminders/notifications
- Calendar import/export (iCal)
- Mobile app (React Native)
- Real-time collaboration
- Advanced CRM features
- Analytics dashboard
- Integration with other calendars (Google Calendar, Outlook)

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

---

Built with modern web technologies for an optimal developer experience.