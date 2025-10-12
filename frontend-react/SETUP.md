# Setup Guide - Echo Notes React Frontend

This guide will help you set up the React frontend application.

## Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

## Step 1: Install Dependencies

```bash
cd frontend-react
npm install
```

This will install all required dependencies including:

- React and React DOM
- Material-UI (MUI) components
- Tailwind CSS
- React Router
- Vite and build tools
- TypeScript

## Step 2: Configure Environment

Create a `.env` file in the `frontend-react` directory:

```bash
cp .env.example .env
```

Edit the `.env` file to set your API URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Step 3: Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3001`

## Step 4: Access the Application

Open your browser and navigate to:

```
http://localhost:3001
```

You should see the home page of the application.

## Development Workflow

### Running the App

```bash
# Start development server with hot reload
npm run dev
```

### Building for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Project Features

### 1. Authentication

- **Login**: `/login`
- **Register**: `/register`
- JWT token-based authentication
- Auto-redirect for protected routes

### 2. Dashboard

- **Dashboard**: `/dashboard`
- Central hub for all features
- Quick access to all modules

### 3. SOAP Notes

- **Generate SOAP**: `/soap`
- AI-powered SOAP note generation
- Real-time transcript processing

### 4. RAG Query

- **Query Documents**: `/rag`
- Natural language search
- Semantic document retrieval

### 5. Patient Management

- **Patients**: `/patients`
- View and manage patient records
- Patient information tracking

### 6. Document Management

- **Upload Documents**: `/documents`
- File upload and management
- Document library

### 7. Sessions

- **Sessions**: `/sessions`
- Patient visit sessions
- Session history

### 8. Settings

- **Settings**: `/settings`
- User profile management
- Account settings

## Technology Stack

### Frontend Framework

- **React 18.3**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server

### UI Framework

- **Material-UI 6.3**: Comprehensive component library
  - Buttons, Cards, Tables, Forms
  - Navigation components
  - Icons and utilities
- **Tailwind CSS 3.4**: Utility-first CSS
  - Responsive design
  - Custom utilities
  - JIT mode enabled

### Routing

- **React Router 7.1**: Client-side routing
  - Protected routes
  - Nested routing
  - Navigation guards

### State Management

- **React Context API**: Global state
  - Authentication context
  - User data management

## Tailwind + MUI Integration

This project uses both Tailwind CSS and Material-UI together:

### Tailwind Configuration

- Preflight disabled to avoid MUI conflicts
- Custom utilities for spacing and layout
- Responsive breakpoints

### MUI Theme

- Custom blue color scheme
- JetBrains Mono font for headings
- Inter font for body text
- Consistent border radius and shadows

### Usage Pattern

```tsx
// MUI for complex components
import { Button, Card, TextField } from "@mui/material";

// Tailwind for layout and utilities
<div className="min-h-screen bg-gray-50 flex items-center">
  <Card className="p-4">
    <Button variant="contained">Click me</Button>
  </Card>
</div>;
```

## File Structure

```
frontend-react/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts
│   ├── lib/            # Utilities and API
│   ├── pages/          # Page components
│   ├── App.tsx         # Main app
│   ├── main.tsx        # Entry point
│   ├── theme.ts        # MUI theme
│   └── index.css       # Global styles
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.ts      # Vite config
├── tsconfig.json       # TypeScript config
├── tailwind.config.js  # Tailwind config
└── postcss.config.js   # PostCSS config
```

## API Integration

### Base URL

Configure in `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### API Endpoints

Defined in `src/lib/api-config.ts`:

- Authentication
- Documents
- Patients
- Sessions
- SOAP Notes
- RAG Queries

### Usage Example

```tsx
import { authApi } from "@/lib";

// Login
const response = await authApi.login({
  email: "user@example.com",
  password: "password",
});

// Store token
localStorage.setItem("access_token", response.access_token);
```

## Troubleshooting

### Port Already in Use

If port 3001 is in use, edit `vite.config.ts`:

```ts
server: {
  port: 3002, // Change to different port
}
```

### API Connection Issues

1. Check backend is running on port 8000
2. Verify VITE_API_BASE_URL in `.env`
3. Check browser console for CORS errors

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### TypeScript Errors

```bash
# Check TypeScript compilation
npx tsc --noEmit
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting with React Router
- Lazy loading for routes
- Optimized MUI bundle
- Tailwind JIT compilation

## Security

- JWT token storage in localStorage
- Protected route guards
- HTTPS recommended for production
- CORS configuration required

## Next Steps

1. Start the backend API
2. Run `npm run dev` in frontend-react
3. Open `http://localhost:3001`
4. Register a new account
5. Explore the features!

## Additional Resources

- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
