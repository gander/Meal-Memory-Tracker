# Co i gdzie jedliśmy? (What and Where Did We Eat?)

A modern meal tracking application with AI-powered photo analysis and multi-dimensional rating system.

## Features

- **AI Photo Analysis**: Upload meal photos and get automatic dish name and restaurant suggestions using OpenAI GPT-4o
- **Multi-dimensional Ratings**: Rate meals from -3 to +3 across taste, presentation, value, and service
- **Smart Search & Filtering**: Find meals by restaurant, dish, or rating categories
- **People Tracking**: Tag who participated in each meal
- **Statistics Dashboard**: View dining trends and meal statistics
- **Polish Language Support**: Optimized for Polish cuisine and restaurants

## Technology Stack

**Frontend**: React 18, TypeScript, Vite, TanStack Query, Radix UI, Tailwind CSS
**Backend**: Node.js, Express.js, TypeScript, Multer (file uploads)
**Database**: PostgreSQL with Drizzle ORM
**AI**: OpenAI API (GPT-4o vision model)
**Infrastructure**: Neon serverless PostgreSQL

## Quick Installation

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd meal-tracking-app
   npm install
   ```

2. **Set environment variables**
   ```env
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Initialize database and start**
   ```bash
   npm run db:push
   npm run dev
   ```

4. **Open** http://localhost:5000

## License

MIT License

## Author

**Adam Gąsowski**