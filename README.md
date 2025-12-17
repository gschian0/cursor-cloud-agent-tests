# AI Calendar - Modern Calendar & CRM Application

A modern, AI-assisted calendar application built with Next.js 14, featuring integrated CRM capabilities, email notifications, and a beautiful user interface.

## 🚀 Features

- **Smart Calendar Management**: Create, view, edit, and delete events with an intuitive calendar interface
- **Event Details Modal**: Click any event to view full details and edit or delete
- **Day Click Creation**: Click on any empty day to quickly create an event starting on that day
- **Integrated CRM**: Track contacts with detailed information including company, position, and custom tags
- **Email Notifications**: Automated event reminders using Resend (optional)
- **Modern Authentication**: Secure sign-in with Google and GitHub OAuth (optional - currently disabled for testing)
- **Beautiful UI**: Responsive design with Tailwind CSS and modern components with improved readability
- **Database-Powered**: PostgreSQL database with Prisma ORM (optimized for Neon)
- **TypeScript**: Full type safety across the application

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM (Neon recommended)
- **Authentication**: NextAuth.js v5 (optional - currently disabled for testing)
- **Email**: Resend (optional)
- **Styling**: Tailwind CSS v4
- **Calendar UI**: react-big-calendar
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 20.x or higher
- A Neon database account (free tier available) or any PostgreSQL database
- npm or yarn

## 🏃 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd cursor-cloud-agent-tests
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Neon Database (Recommended)

1. Sign up for a free account at [Neon](https://neon.tech)
2. Create a new project
3. Copy your connection string (it will look like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)
4. **Note**: Do not enable Neon's built-in auth - this app uses NextAuth for authentication

### 4. Set up environment variables

Create a `.env.local` file (or copy from `.env.example`):

```bash
cp .env.example .env.local
```

**Required variables:**
- **DATABASE_URL**: Your Neon connection string
- **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`
- **NEXTAUTH_URL**: Your application URL (http://localhost:3000 for development)

**Optional variables** (for full functionality):
- **GOOGLE_CLIENT_ID** & **GOOGLE_CLIENT_SECRET**: For Google OAuth (currently disabled for testing)
- **GITHUB_ID** & **GITHUB_SECRET**: For GitHub OAuth (currently disabled for testing)
- **RESEND_API_KEY** & **RESEND_FROM_EMAIL**: For email notifications

### 5. Set up the database

Generate Prisma client and push the schema to your Neon database:

```bash
npx prisma generate
npx prisma db push
```

This will create all necessary tables in your database.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth API routes
│   │   ├── events/        # Event CRUD operations
│   │   └── contacts/      # Contact management
│   ├── auth/
│   │   └── signin/        # Sign-in page
│   ├── DashboardClient.tsx # Main dashboard component
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── Calendar.tsx           # Calendar component
│   ├── CreateEventModal.tsx   # Create/Edit event modal
│   ├── EventDetailsModal.tsx  # Event details and actions
│   ├── CreateContactModal.tsx # Contact creation modal
│   └── ContactsList.tsx      # Contacts list view
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client with Neon adapter
│   ├── email.ts          # Resend email utilities
│   ├── test-user.ts      # Test user helper (for development)
│   └── utils.ts          # Utility functions
└── prisma/
    └── schema.prisma     # Database schema
```

## 🎨 Key Components

### Calendar
- Monthly, weekly, and daily views
- Click on empty days to create events (auto-fills date)
- Click on events to view details, edit, or delete
- Color-coded events with improved readability
- Event details modal with full information display

### CRM Contacts
- Contact management with full details
- Tag-based organization
- Company and position tracking
- Notes and custom fields

### Email Notifications
- Automatic event reminders
- Powered by Resend
- Customizable email templates

## 🔒 Authentication

**Note**: Authentication is currently disabled for testing purposes. The app uses a test user account for all operations.

The application includes NextAuth.js v5 setup with support for:
- Google OAuth (configured but disabled)
- GitHub OAuth (configured but disabled)

To re-enable authentication, update the API routes in `app/api/events/route.ts` and `app/api/contacts/route.ts` to use session-based auth instead of the test user.

## 🗄️ Database Schema

The application includes models for:
- **Users**: Authentication and user profiles
- **Events**: Calendar events with full details
- **Contacts**: CRM contact information
- **Sessions/Accounts**: OAuth session management

## 📧 Email Integration

Email notifications are sent using Resend for:
- Event reminders
- Event updates
- Calendar invitations

## 🚀 Deployment

### Vercel + Neon (Recommended)

1. Create a Neon database (if you haven't already)
2. Push your code to GitHub
3. Import your repository in Vercel
4. Add environment variables:
   - `DATABASE_URL` (from Neon)
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your Vercel deployment URL)
   - Optional: OAuth credentials and Resend API key
5. Deploy!

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

Make sure to:
1. Set up a PostgreSQL database
2. Configure all environment variables
3. Run database migrations

## 🧪 Development

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name description

# Reset database
npx prisma migrate reset
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment
- Prisma for the excellent ORM
- All other open-source contributors

---

Built with ❤️ using Next.js and modern web technologies
