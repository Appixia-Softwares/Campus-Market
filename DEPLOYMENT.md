# Deployment Guide 🚀

This guide covers deploying Campus Market to various platforms and environments.

## 📋 Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- Firebase project configured
- Environment variables set up
- Domain name (for production)

## 🔧 Environment Setup

### 1. Firebase Configuration

1. **Create Firebase Project**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase in your project
   firebase init
   ```

2. **Configure Firebase Services**
   - Authentication (Email/Password, Google)
   - Firestore Database
   - Storage
   - Functions (optional)

3. **Get Firebase Config**
   ```javascript
   // Copy from Firebase Console > Project Settings
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   }
   ```

### 2. Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Firebase Admin SDK
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PROJECT_ID=your_project_id

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 🌐 Deployment Options

### 1. Vercel (Recommended)

Vercel provides the best experience for Next.js applications.

#### Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   # Login to Vercel
   vercel login
   
   # Deploy to production
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add all variables from your `.env` file

4. **Custom Domain**
   - Go to Vercel Dashboard > Your Project > Settings > Domains
   - Add your custom domain
   - Configure DNS records

#### Vercel Configuration

Create `vercel.json` in your project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. Netlify

#### Setup

1. **Build Configuration**
   ```bash
   # Build command
   npm run build
   
   # Publish directory
   .next
   ```

2. **Environment Variables**
   - Go to Netlify Dashboard > Site Settings > Environment Variables
   - Add all required environment variables

3. **Deploy**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Deploy
   netlify deploy --prod
   ```

### 3. Firebase Hosting

#### Setup

1. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```

2. **Configure firebase.json**
   ```json
   {
     "hosting": {
       "public": "out",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

3. **Build and Deploy**
   ```bash
   # Build for static export
   npm run build
   npm run export
   
   # Deploy to Firebase
   firebase deploy --only hosting
   ```

### 4. Docker Deployment

#### Dockerfile

```dockerfile
# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'
services:
  campus-market:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
      - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
      # Add other environment variables
    restart: unless-stopped
```

#### Deploy with Docker

```bash
# Build the image
docker build -t campus-market .

# Run the container
docker run -p 3000:3000 campus-market

# Or with docker-compose
docker-compose up -d
```

## 🔒 Security Configuration

### 1. Firebase Security Rules

#### Firestore Rules

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
    
    // Messages can be read/written by participants
    match /conversations/{conversationId}/messages/{messageId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
  }
}
```

#### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload their own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Product images can be read by anyone, uploaded by authenticated users
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 2. HTTPS Configuration

#### Vercel
HTTPS is automatically enabled on Vercel.

#### Custom Domain
```bash
# Install certbot for Let's Encrypt
sudo apt-get install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Monitoring and Analytics

### 1. Vercel Analytics

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to your app
import { Analytics } from '@vercel/analytics/react'

export default function App() {
  return (
    <>
      <Analytics />
      {/* Your app */}
    </>
  )
}
```

### 2. Firebase Analytics

```bash
# Install Firebase Analytics
npm install firebase/analytics

# Initialize in your app
import { getAnalytics } from 'firebase/analytics'

const analytics = getAnalytics(app)
```

### 3. Error Monitoring

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure sentry.config.js
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(
  {
    // Your Next.js config
  },
  {
    // Sentry config
  }
)
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

2. **Environment Variables**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify Firebase configuration

3. **Firebase Connection**
   ```bash
   # Test Firebase connection
   firebase projects:list
   firebase use your-project-id
   ```

4. **Performance Issues**
   ```bash
   # Analyze bundle size
   npm run build
   npx @next/bundle-analyzer
   ```

### Debug Commands

```bash
# Check environment variables
echo $NEXT_PUBLIC_FIREBASE_API_KEY

# Test Firebase connection
firebase auth:export users.json

# Check build output
npm run build && npm start

# Monitor logs
vercel logs
```

## 📞 Support

For deployment issues:

- **Vercel Support**: https://vercel.com/support
- **Firebase Support**: https://firebase.google.com/support
- **Email**: deploy@campusmarke.co.zw

---

*Last updated: January 2024* 