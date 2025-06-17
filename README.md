# AI Meal Assistant

A comprehensive AI-powered meal planning platform featuring intelligent meal generation, social discovery, and advanced nutrition management.

## 🚀 Features

### Core Functionality
- **AI Meal Planning**: OpenAI-powered personalized meal plan generation
- **Recipe Management**: Browse, create, and manage recipe collections
- **Social Platform**: Follow friends, discover trending meals, share cooking achievements
- **Pantry Tracking**: Smart inventory management with grocery list integration
- **Push Notifications**: Cooking reminders and meal alerts via Expo notifications
- **Admin Dashboard**: Comprehensive analytics and system management

### Technology Stack
- **Backend**: Node.js, Express, TypeScript, PostgreSQL with Drizzle ORM
- **Frontend**: React, Vite, TailwindCSS, shadcn/ui components
- **Mobile**: React Native with Expo, TypeScript
- **Authentication**: JWT with Google OAuth integration
- **Database**: PostgreSQL with Neon serverless
- **AI Integration**: OpenAI GPT-4 for meal generation

## 📱 Platform Support

### Web Application
- Modern React SPA with responsive design
- Real-time meal plan generation and management
- Social discovery features with trending content
- Comprehensive admin dashboard for system management

### Mobile Application (React Native)
- Native iOS and Android support via Expo
- Secure authentication with token management
- Push notifications for cooking reminders
- Offline-capable grocery list management

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- OpenAI API key

### Environment Variables

Create `.env` file in the project root:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Authentication
JWT_SECRET=your_jwt_secret_key

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Development
NODE_ENV=development
USE_MOCK_AI=false
```

### Database Setup

1. Create a PostgreSQL database (Neon recommended)
2. Run database migrations:
```bash
npm run db:push
```

### Web Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Mobile Application

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on specific platform
npm run android  # Android
npm run ios      # iOS
npm run web      # Web preview
```

## 🏗️ Project Structure

```
├── client/                 # React web application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
├── mobile/                # React Native application
│   ├── src/
│   │   ├── screens/       # Mobile screens
│   │   ├── navigation/    # Navigation configuration
│   │   ├── services/      # API and external services
│   │   └── contexts/      # React contexts
├── server/                # Express backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations
│   ├── services/          # Business logic services
│   └── middleware/        # Express middleware
├── shared/                # Shared types and schemas
│   └── schema.ts          # Drizzle database schema
└── mock-data/             # Development mock data
```

## 🔧 Development

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Generate Drizzle migrations
npm run db:generate

# View database in Drizzle Studio
npm run db:studio
```

### Mock Data Mode
For development without OpenAI API usage:
```env
USE_MOCK_AI=true
```

### Admin Access
Create a super admin user in the database:
```sql
UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

## 🚀 Deployment

### Web Application (Replit/Vercel/Netlify)
1. Set environment variables in deployment platform
2. Configure database connection
3. Deploy using platform-specific commands

### Mobile Application
1. Configure Expo app.json with your project details
2. Build for production:
```bash
expo build:android  # Android APK
expo build:ios      # iOS IPA
```

## 📖 API Documentation

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/google` - Google OAuth login

### Meal Planning Endpoints
- `GET /api/mealplans` - Get user meal plans
- `POST /api/mealplan` - Generate new meal plan
- `POST /api/mealplans/:id/shuffle-meal` - Replace meal in plan

### Social Features
- `GET /api/discover/trending-recipes` - Get trending recipes
- `GET /api/discover/friend-activity` - Get friend cooking activity
- `POST /api/users/:userId/follow` - Follow/unfollow user

## 🔒 Security

- JWT token-based authentication
- bcrypt password hashing
- Environment variable protection
- Rate limiting on API endpoints
- SQL injection prevention with Drizzle ORM

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for AI-powered meal generation
- Expo team for React Native development platform
- shadcn/ui for beautiful UI components
- Drizzle team for type-safe database operations