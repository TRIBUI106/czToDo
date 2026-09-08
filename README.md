# czToDo - Chrome Extension + Web App

A complete personal todo list application with Chrome Extension, Web App, and real-time sync via Supabase.

**📚 Full Documentation:** See [@docs/INDEX.md](@docs/INDEX.md)

## ✨ Features

- **🔐 User Authentication**: Secure login and registration with NextAuth.js
- **📝 Todo Management**: Create, read, update, and delete todos
- **🎯 Priority Levels**: Set priorities (Low, Medium, High) for your tasks
- **📂 Categories**: Organize todos with custom categories
- **📅 Due Dates**: Set and track due dates for your tasks
- **✅ Mark Complete**: Track completion status
- **🌙 Dark Mode**: Toggle between light and dark themes
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices
- **🎨 Modern UI**: Clean, intuitive interface built with Tailwind CSS
- **⚡ Fast Performance**: Built with Next.js 14 App Router

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (production)
- **UI Components**: Custom components built with Radix primitives
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📚 Documentation

All documentation is organized in the [@docs/](@docs/) directory:

### Quick Links
- **Getting Started:** [@docs/QUICK_START.md](@docs/QUICK_START.md)
- **Chrome Extension Testing:** [@docs/CHROME_TESTING_START.md](@docs/CHROME_TESTING_START.md)
- **Full Testing Guide:** [@docs/TESTING_GUIDE.md](@docs/TESTING_GUIDE.md)
- **Project Summary:** [@docs/FINAL_SUMMARY.md](@docs/FINAL_SUMMARY.md)
- **CI/CD Setup:** [@docs/CI_CD_SETUP.md](@docs/CI_CD_SETUP.md)
- **Documentation Index:** [@docs/INDEX.md](@docs/INDEX.md)

See [@docs/INDEX.md](@docs/INDEX.md) for complete documentation index.

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd czToDoList
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Getting Started

1. **Register an Account**: Create a new account with your email and password
2. **Login**: Sign in with your credentials
3. **Add Your First Todo**: Click "Add New Todo" and fill in the details
4. **Organize**: Use categories, priorities, and due dates to stay organized
5. **Track Progress**: Mark todos as complete when finished

### Features Guide

- **Adding Todos**: Fill out the form with title, description, category, priority, and due date
- **Editing**: Click the edit icon to modify todo titles
- **Completing**: Click the check icon to mark todos as complete
- **Deleting**: Click the trash icon to permanently delete todos
- **Dark Mode**: Use the theme toggle in the top-right corner

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**: Make sure your code is in a GitHub repository

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect it's a Next.js project

3. **Configure Environment Variables** in Vercel Dashboard:
   ```env
   DATABASE_URL=your-production-database-url
   NEXTAUTH_URL=https://your-app-name.vercel.app
   NEXTAUTH_SECRET=your-production-secret-key
   ```

4. **Set up Production Database**:
   - For PostgreSQL, you can use services like:
     - [Neon](https://neon.tech/) (recommended)
     - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
     - [Supabase](https://supabase.com/)
     - [PlanetScale](https://planetscale.com/)

5. **Deploy**: Vercel will automatically deploy your application

### Database Migration for Production

After deploying, run the database migration:

```bash
npx prisma migrate deploy
```

## 🗂️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── todos/         # Todo CRUD endpoints
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main todo dashboard
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── providers.tsx     # Context providers
│   └── theme-toggle.tsx  # Theme switcher
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth configuration
│   ├── prisma.ts        # Database client
│   └── utils.ts         # Utility functions
└── types/               # TypeScript definitions
```

## 🔒 Security Features

- **Password Hashing**: Passwords are securely hashed using bcryptjs
- **Session Management**: Secure JWT-based sessions with NextAuth.js
- **CSRF Protection**: Built-in CSRF protection with NextAuth.js
- **Environment Variables**: Sensitive data stored in environment variables
- **Input Validation**: Server-side validation for all user inputs

## 🎨 Customization

### Themes
The app supports both light and dark themes. You can customize the color scheme in:
- `src/app/globals.css` - CSS custom properties
- `tailwind.config.js` - Tailwind configuration

### Adding Features
The modular structure makes it easy to add new features:
- Add new API routes in `src/app/api/`
- Create new pages in `src/app/`
- Add components in `src/components/`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Todos
- `GET /api/todos` - Get user's todos (with filtering)
- `POST /api/todos` - Create new todo
- `GET /api/todos/[id]` - Get specific todo
- `PUT /api/todos/[id]` - Update todo
- `DELETE /api/todos/[id]` - Delete todo

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [NextAuth.js](https://next-auth.js.org/) - Complete open source authentication solution
- [Prisma](https://www.prisma.io/) - Next-generation Node.js and TypeScript ORM
- [Lucide](https://lucide.dev/) - Beautiful & consistent icon toolkit

---

Built with ❤️ for personal productivity