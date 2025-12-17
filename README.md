# AI Calendar - Modern Calendar & CRM Application

A modern, AI-assisted calendar application built with Next.js 14, featuring integrated CRM capabilities, email notifications, and a beautiful user interface.

## 🚀 Features

- **Smart Calendar Management**: Create, view, and manage events with an intuitive calendar interface
- **Integrated CRM**: Track contacts with detailed information including company, position, and custom tags
- **Email Notifications**: Automated event reminders using Resend
- **Modern Authentication**: Secure sign-in with Google and GitHub OAuth
- **Beautiful UI**: Responsive design with Tailwind CSS and modern components
- **Database-Powered**: PostgreSQL database with Prisma ORM
- **TypeScript**: Full type safety across the application

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (beta)
- **Email**: Resend
- **Styling**: Tailwind CSS v4
- **Calendar UI**: react-big-calendar
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 20.x or higher
- PostgreSQL database
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

### 3. Set up environment variables

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Update the following in your `.env` file:

- **DATABASE_URL**: Your PostgreSQL connection string
- **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`
- **NEXTAUTH_URL**: Your application URL (http://localhost:3000 for development)
- **Google OAuth**: Create credentials at [Google Cloud Console](https://console.cloud.google.com/)
- **GitHub OAuth**: Create an OAuth app at [GitHub Developer Settings](https://github.com/settings/developers)
- **Resend API**: Get your API key from [Resend Dashboard](https://resend.com/)

### 4. Set up the database

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server

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
│   ├── Calendar.tsx       # Calendar component
│   ├── CreateEventModal.tsx
│   ├── CreateContactModal.tsx
│   └── ContactsList.tsx
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   ├── email.ts          # Resend email utilities
│   └── utils.ts          # Utility functions
└── prisma/
    └── schema.prisma     # Database schema
```

## 🎨 Key Components

### Calendar
- Monthly, weekly, and daily views
- Drag and drop event creation
- Color-coded events
- Event details modal

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

The application uses NextAuth.js with support for:
- Google OAuth
- GitHub OAuth
- Email/password (can be added)

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

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy!

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
