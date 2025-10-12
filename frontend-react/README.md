# Echo Notes - React Frontend

A modern React application built with Material-UI and Tailwind CSS for managing medical notes, SOAP notes, and patient records.

## 🚀 Features

- **Material-UI (MUI)**: Modern, accessible UI components
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **React Router**: Client-side routing
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Authentication**: JWT-based authentication with protected routes
- **SOAP Notes Generation**: AI-powered SOAP note generation
- **RAG Query**: Query patient documents using RAG
- **Patient Management**: Manage patient records
- **Document Upload**: Upload and manage documents

## 📦 Tech Stack

- React 18.3
- Material-UI 6.3
- Tailwind CSS 3.4
- TypeScript 5.7
- Vite 6.0
- React Router 7.1

## 🛠️ Setup

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run development server
npm run dev
```

The application will be available at `http://localhost:3001`

## 📁 Project Structure

```
src/
├── components/         # Reusable components
│   ├── Loading.tsx
│   └── ProtectedRoute.tsx
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── lib/               # API utilities
│   ├── api-config.ts
│   ├── auth.ts
│   ├── documents.ts
│   └── index.ts
├── pages/             # Page components
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── documents/
│   │   └── DocumentUploadPage.tsx
│   ├── patients/
│   │   └── PatientsPage.tsx
│   ├── rag/
│   │   └── RAGQueryPage.tsx
│   ├── sessions/
│   │   └── SessionsPage.tsx
│   ├── settings/
│   │   └── SettingsPage.tsx
│   ├── soap/
│   │   └── SOAPGeneratePage.tsx
│   └── HomePage.tsx
├── App.tsx            # Main app component
├── main.tsx           # Entry point
├── theme.ts           # MUI theme configuration
└── index.css          # Global styles
```

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🚦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 UI Components

This project uses Material-UI (MUI) for UI components and Tailwind CSS for utility styling:

- **MUI Components**: Buttons, Cards, TextFields, AppBar, etc.
- **Tailwind Utilities**: Spacing, colors, responsive design
- **Custom Theme**: Blue primary color scheme matching the brand

## 🔐 Authentication

The app uses JWT-based authentication:

1. Users log in with email/password
2. JWT tokens are stored in localStorage
3. Protected routes require authentication
4. Auto-redirect to login for unauthenticated users

## 📄 License

MIT

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
