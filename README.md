# Co i gdzie jedliśmy? (What and Where Did We Eat?)

A modern full-stack web application for tracking and rating meals at restaurants with AI-powered photo analysis and multi-dimensional rating system.

## 🚀 Features

### Core Functionality
- **Photo Upload & Analysis**: Upload meal photos and get AI-powered suggestions for dish names, restaurants, and ratings
- **Multi-dimensional Rating System**: Rate meals on a scale from -3 to +3 across four dimensions:
  - Taste quality
  - Visual presentation
  - Value for money
  - Service quality
- **Smart Categorization**: AI automatically suggests dish categories and restaurant types
- **People Tagging**: Track who participated in each meal
- **Advanced Search & Filtering**: Filter meals by ratings, search by dish/restaurant names
- **Statistics Dashboard**: View meal statistics including total meals, average ratings, and monthly trends

### AI Integration
- **OpenAI GPT-4o Integration**: Latest vision model for accurate food recognition
- **Polish Language Support**: AI responses optimized for Polish cuisine and dining culture
- **Intelligent Suggestions**: Auto-complete for restaurants, dishes, and people based on your history
- **Confidence Scoring**: AI provides confidence levels for its suggestions

### Technical Features
- **Real-time Updates**: Live data synchronization across all components
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Mode Support**: Complete theming system with light/dark modes
- **File Management**: Secure image upload with validation and optimization
- **Database Relationships**: Normalized data structure for efficient querying

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **Radix UI + shadcn/ui** for accessible, customizable components
- **Tailwind CSS** with CSS variables for consistent theming
- **React Hook Form + Zod** for form validation

### Backend
- **Node.js + Express.js** for the API server
- **TypeScript** with ES modules for modern JavaScript
- **Multer** for handling file uploads
- **OpenAI API** for AI-powered photo analysis

### Database & Infrastructure
- **PostgreSQL** with Neon serverless hosting
- **Drizzle ORM** for type-safe database operations
- **Express Sessions** with PostgreSQL store for session management

## 🏗️ Architecture

### Database Schema
```
restaurants
├── id (serial, primary key)
├── name (text, not null)
├── address (text)
└── createdAt (timestamp)

dishes
├── id (serial, primary key)
├── name (text, not null)
├── category (text)
└── createdAt (timestamp)

people
├── id (serial, primary key)
├── name (text, not null, unique)
└── createdAt (timestamp)

meals
├── id (serial, primary key)
├── restaurantId (integer, foreign key)
├── dishId (integer, foreign key)
├── photoUrl (text)
├── price (decimal)
├── description (text, not null)
├── tasteRating (integer, -3 to 3)
├── presentationRating (integer, -3 to 3)
├── valueRating (integer, -3 to 3)
├── serviceRating (integer, -3 to 3)
├── isExcellent (boolean)
├── wantAgain (boolean)
└── createdAt (timestamp)

meal_people (junction table)
├── id (serial, primary key)
├── mealId (integer, foreign key)
└── personId (integer, foreign key)
```

### API Endpoints
- `GET /api/meals` - Fetch meals with filtering and pagination
- `POST /api/meals` - Create new meal with photo upload
- `PATCH /api/meals/:id` - Update existing meal
- `DELETE /api/meals/:id` - Delete meal
- `GET /api/stats` - Get meal statistics
- `GET /api/restaurants/search` - Search restaurants
- `GET /api/dishes/search` - Search dishes
- `GET /api/people/search` - Search people
- `POST /api/analyze-photo` - AI photo analysis endpoint

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed
- PostgreSQL database (or Neon account)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd meal-tracking-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file or use Replit Secrets:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 📱 Usage

### Adding a New Meal

1. Click the floating "+" button or navigate to "Add Meal"
2. Upload a photo of your meal
3. Wait for AI analysis to suggest dish name, restaurant, and ratings
4. Adjust the suggestions as needed
5. Add optional price and people who participated
6. Write a description of your experience
7. Fine-tune the multi-dimensional ratings
8. Mark as "Excellent" or "Want Again" if applicable
9. Submit to save the meal

### Browsing Your Meal History

1. Use the search bar to find specific dishes or restaurants
2. Apply filters by rating categories (Excellent, Want Again, High/Low ratings)
3. View detailed meal cards with photos, ratings, and descriptions
4. Check the statistics dashboard for insights into your dining habits

### AI Features

The AI automatically analyzes uploaded photos to:
- Identify dish names in Polish
- Suggest restaurant types or specific venues
- Predict ratings based on visual appearance
- Categorize dishes (appetizers, mains, desserts, etc.)
- Provide confidence scores for suggestions

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow TypeScript best practices and use provided ESLint configuration
2. **Database Changes**: Always use Drizzle migrations (`npm run db:push`)
3. **Component Structure**: Use shadcn/ui components and maintain consistency
4. **API Design**: Follow RESTful conventions and include proper error handling
5. **Testing**: Test all new features manually before committing

### Project Structure
```
├── client/src/           # Frontend React application
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utility functions and configurations
├── server/              # Backend Express application
│   ├── services/        # Business logic services
│   └── routes.ts        # API route definitions
├── shared/              # Shared types and schemas
└── uploads/             # File upload directory
```

## 📄 License

MIT License - see LICENSE file for details.

## 👤 Author

**Adam Gąsowski**

## 🐛 Troubleshooting

### Common Issues

**AI Analysis Not Working**
- Verify your OpenAI API key is correctly set
- Check that the image file is under 5MB
- Ensure the image format is supported (JPEG, PNG)

**Database Connection Errors**
- Verify DATABASE_URL environment variable
- Check PostgreSQL server is running
- Run `npm run db:push` to ensure schema is up to date

**File Upload Issues**
- Check that the uploads directory exists and is writable
- Verify file size limits (5MB max)
- Ensure proper image MIME types

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript configuration matches project structure
- Verify all environment variables are set

## 🔮 Future Enhancements

- **Social Features**: Share meals and restaurants with friends
- **Export Data**: Export meal history to various formats
- **Recipe Integration**: Link dishes to recipes
- **Nutritional Analysis**: AI-powered nutrition estimation
- **Recommendation Engine**: Suggest new restaurants based on preferences
- **Mobile App**: Native iOS/Android applications
- **Integration APIs**: Connect with restaurant booking platforms