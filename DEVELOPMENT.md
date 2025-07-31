# Development Guide 🛠️

This guide provides comprehensive instructions for setting up and developing Campus Market locally.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm**, **yarn**, or **pnpm**
- **Git**
- **Firebase CLI** (for deployment)
- **VS Code** (recommended editor)

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/praisetechzw/Campus-Market.git
cd Campus-Market
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### 3. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your Firebase configuration
nano .env
```

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 🔧 Development Environment

### VS Code Setup

#### Recommended Extensions

Install these VS Code extensions for the best development experience:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "firebase.vscode-firebase-ext",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

#### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

### Prettier Configuration

Create `.prettierrc`:

```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### ESLint Configuration

The project uses ESLint for code quality. Run:

```bash
npm run lint
```

## 📁 Project Structure

```
Campus-Market/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (main)/            # Main application routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── admin/            # Admin-specific components
│   └── analytics/        # Analytics components
├── lib/                  # Core utilities and configurations
│   ├── actions/          # Server actions
│   ├── api/              # API utilities
│   └── firebase.ts       # Firebase configuration
├── hooks/                # Custom React hooks
├── services/             # Business logic services
├── types/                # TypeScript type definitions
├── public/               # Static assets
└── scripts/              # Build and utility scripts
```

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "Campus Market"
4. Enable Google Analytics (optional)
5. Create project

### 2. Configure Firebase Services

#### Authentication
1. Go to Authentication > Sign-in method
2. Enable Email/Password
3. Enable Google (optional)

#### Firestore Database
1. Go to Firestore Database
2. Create database in test mode
3. Choose a location close to your users

#### Storage
1. Go to Storage
2. Get started
3. Choose a location

### 3. Get Configuration

1. Go to Project Settings
2. Scroll to "Your apps"
3. Click the web icon (</>)
4. Register app and copy config

### 4. Update Environment Variables

```bash
# .env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Create test files with `.test.ts` or `.test.tsx` extension:

```typescript
// components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

## 🔄 Database Management

### Firestore Rules

Update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products can be read by anyone, written by authenticated users
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Database Seeding

```bash
# Seed categories
npm run seed:categories

# Seed schools
npm run seed:schools

# Seed Firebase with initial data
npm run seed:firebase
```

## 🚀 Build and Deployment

### Development Build

```bash
# Build for development
npm run build

# Start production server
npm start
```

### Production Build

```bash
# Build for production
npm run build

# Export static files (if needed)
npm run export
```

### Deployment Scripts

```bash
# Deploy to Vercel
vercel --prod

# Deploy to Firebase
firebase deploy

# Deploy with Docker
docker build -t campus-market .
docker run -p 3000:3000 campus-market
```

## 🔍 Debugging

### Development Tools

#### React Developer Tools
- Install [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Use Components and Profiler tabs

#### Redux DevTools (if using Redux)
- Install [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

### Debugging Commands

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npm run lint

# Check bundle size
npm run build
npx @next/bundle-analyzer

# Check for security vulnerabilities
npm audit
```

### Common Issues

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### Firebase Connection Issues
```bash
# Test Firebase connection
firebase projects:list
firebase use your-project-id
```

#### Environment Variables
```bash
# Check environment variables
echo $NEXT_PUBLIC_FIREBASE_API_KEY
```

## 📊 Performance Optimization

### Code Splitting

```typescript
// Lazy load components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>
})
```

### Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/product-image.jpg"
  alt="Product"
  width={300}
  height={200}
  priority
/>
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

## 🔧 Customization

### Theming

Update `tailwind.config.ts` for custom themes:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
    },
  },
}

export default config
```

### Component Library

The project uses shadcn/ui components. Add new components:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
```

## 📚 Learning Resources

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

### Firebase
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React with TypeScript](https://react-typescript-cheatsheet.netlify.app/)

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind UI](https://tailwindui.com/)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

## 📞 Support

### Getting Help

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/Campus-Market/issues)
- **Discussions**: [Join discussions](https://github.com/yourusername/Campus-Market/discussions)
- **Email**: dev@campusmarke.co.zw

### Community

- **Discord**: [Join our Discord](https://discord.gg/campusmarket)
- **Twitter**: [Follow us](https://twitter.com/campusmarket)
- **Blog**: [Read our blog](https://blog.campusmarke.co.zw)

---

*Happy coding! 🎓🛒* 