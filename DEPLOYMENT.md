# AI Meal Assistant - Production Deployment Guide

## Production Readiness Status ✅

This application is **production-ready** with the following features:

### Core Features
- ✅ Complete AI-powered meal planning system
- ✅ User authentication (email/password + Google OAuth)
- ✅ PostgreSQL database with full data persistence
- ✅ React web application with responsive design
- ✅ React Native mobile app with complete functionality
- ✅ Admin dashboard with role-based access control
- ✅ Push notification system with cooking reminders
- ✅ Pantry tracking and smart grocery list generation
- ✅ Recipe management with cooking session timers

### Production Architecture
- ✅ Express.js backend with TypeScript
- ✅ PostgreSQL database with Drizzle ORM
- ✅ JWT-based authentication
- ✅ Environment-based configuration
- ✅ Production build scripts
- ✅ Memory caching for performance
- ✅ Error handling and logging

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd mealplan-pro
npm install
```

### 2. Environment Configuration
Create `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mealplan_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# AI Integration
OPENAI_API_KEY=your-openai-api-key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Environment
NODE_ENV=development
PORT=5000
```

### 3. Database Setup
```bash
# Push database schema
npm run db:push
```

### 4. Run Development Server
```bash
# Start both backend and frontend
npm run dev
```

### 5. Build for Production
```bash
# Build the application
npm run build

# Start production server
npm run start
```

## Mobile App Setup

The React Native mobile app is located in the `/mobile` directory:

```bash
cd mobile
npm install

# For iOS
npx expo run:ios

# For Android  
npx expo run:android

# For web preview
npx expo start --web
```

## Production Deployment Options

### Option 1: Traditional Hosting (Recommended)

#### Backend Deployment (Railway, Render, DigitalOcean)
1. Deploy the Node.js application
2. Set environment variables
3. Connect PostgreSQL database
4. Run `npm run build && npm run start`

#### Frontend Deployment (Vercel, Netlify)
1. Build static files: `npm run build`
2. Deploy the `dist/public` folder
3. Configure API proxy to backend

### Option 2: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

### Option 3: Cloud Platforms
- **Vercel**: Full-stack deployment with edge functions
- **Railway**: Simple PostgreSQL + Node.js deployment
- **Render**: Auto-deploy from GitHub with database
- **Heroku**: Traditional platform-as-a-service

## Required Environment Variables

### Essential (Required)
```env
DATABASE_URL=postgresql://...          # PostgreSQL connection string
JWT_SECRET=...                        # JWT signing secret (32+ characters)
OPENAI_API_KEY=sk-...                # OpenAI API key for meal generation
```

### Optional (Enhanced Features)
```env
GOOGLE_CLIENT_ID=...                 # Google OAuth client ID
GOOGLE_CLIENT_SECRET=...             # Google OAuth client secret
USE_MOCK_AI=true                     # Use mock data instead of OpenAI (development)
```

## Database Requirements

### PostgreSQL Setup
The application requires PostgreSQL 12+ with the following:
- Connection pooling support
- JSONB column support (for recipes, meal plans)
- Full-text search capabilities

### Schema Migration
The database schema is automatically managed by Drizzle ORM:
```bash
npm run db:push  # Applies schema changes
```

## Performance Considerations

### Backend Optimizations
- ✅ Memory caching for frequently accessed data
- ✅ Database connection pooling
- ✅ Efficient SQL queries with proper indexing
- ✅ Response compression and rate limiting

### Frontend Optimizations  
- ✅ React Query for intelligent data caching
- ✅ Code splitting and lazy loading
- ✅ Optimized bundle size with Vite
- ✅ Responsive images and assets

## Security Features

### Authentication & Authorization
- ✅ JWT tokens with secure expiration
- ✅ bcrypt password hashing
- ✅ Role-based access control (admin/user)
- ✅ Google OAuth integration
- ✅ Session management

### Data Protection
- ✅ SQL injection prevention with Drizzle ORM
- ✅ XSS protection with input sanitization
- ✅ CORS configuration
- ✅ Environment variable security

## Monitoring & Maintenance

### Logging
- ✅ Structured error logging
- ✅ Admin dashboard with system metrics
- ✅ User activity tracking
- ✅ Performance monitoring

### Backup Strategy
- Regular PostgreSQL backups
- Environment variable backup
- User data export capabilities

## Mobile App Distribution

### iOS App Store
1. Build with Expo EAS: `eas build --platform ios`
2. Submit to App Store Connect
3. Configure app store metadata

### Google Play Store
1. Build with Expo EAS: `eas build --platform android`
2. Upload to Google Play Console
3. Configure store listing

### Web Progressive App
The mobile app can also run as a PWA:
```bash
cd mobile
npx expo export --platform web
```

## Support & Troubleshooting

### Common Issues
1. **Database Connection**: Verify DATABASE_URL format and permissions
2. **OpenAI API**: Check API key validity and usage limits
3. **Google OAuth**: Ensure client ID/secret are correctly configured
4. **Build Errors**: Clear node_modules and reinstall dependencies

### Health Checks
The application includes health check endpoints:
- `GET /health` - Basic server status
- `GET /api/admin/metrics` - Detailed system metrics (admin only)

## Next Steps

1. **Clone the repository** to your local machine
2. **Set up environment variables** as documented above
3. **Configure your PostgreSQL database**
4. **Obtain API keys** (OpenAI required, Google OAuth optional)
5. **Run locally** to test everything works
6. **Deploy to your preferred platform**

The application is fully functional and ready for production use!