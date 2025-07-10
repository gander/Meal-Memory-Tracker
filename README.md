# 🍽️ Co i gdzie jedliśmy? (What and Where Did We Eat?)

📱 A modern Polish AI-powered meal tracking application that transforms dining experiences into intelligent, interactive nutritional insights. Designed to make food journaling engaging, personalized, and effortless for food enthusiasts.

📋 **[View Changelog](CHANGELOG.md)** - See all version updates and new features

## ✨ Features

### 🤖 AI-Powered Intelligence
- **Smart Photo Analysis**: Upload meal photos and get automatic dish recognition using OpenAI GPT-4o
- **Text Correction**: Automatic Polish language correction for descriptions with spelling, grammar, and diacritics
- **Intelligent Suggestions**: AI-powered dish categorization and rating predictions

### 📸 Advanced Image Management
- **QOI Database Storage**: Efficient image compression and database storage eliminating file dependencies
- **Dynamic Serving**: Images served through `/api/images/{id}` with automatic format conversion
- **Fallback System**: Robust base64 fallback when QOI processing fails

### 🏪 Restaurant Management
- **Simple Restaurant Selection**: Easy-to-use restaurant dropdown with alphabetical sorting
- **Quick Restaurant Creation**: Add new restaurants directly from meal forms
- **Searchable Interface**: Real-time restaurant search and filtering capabilities
- **Manual Address Entry**: Traditional address input without location dependencies

### ⭐ Rating & Organization
- **Multi-dimensional Ratings**: Rate meals from -3 to +3 across taste, presentation, value, and service
- **Smart Filtering**: Filter by excellence, "want again", rating levels, and search terms
- **People Tracking**: Tag meal participants and track dining companions
- **Statistics Dashboard**: Clean overview showing total meals, average ratings, and restaurant count

### 🇵🇱 Polish Language Optimization
- **Native Polish Support**: Optimized for Polish cuisine, restaurants, and descriptions
- **Real-time Text Correction**: Automatic correction of Polish diacritics and grammar
- **Cultural Context**: Understanding of Polish dining culture and food terminology

## 🛠️ Technology Stack

### Frontend
- ⚛️ React 18
- 📘 TypeScript
- ⚡ Vite
- 🔄 TanStack Query
- 🎨 Radix UI
- 🎭 Tailwind CSS

### Backend
- 🟢 Node.js
- 🚀 Express.js
- 📘 TypeScript
- 📁 Multer (file uploads)

### Database & AI
- 🐘 PostgreSQL (Neon serverless)
- 🔧 Drizzle ORM with type safety
- 🧠 OpenAI GPT-4o (latest vision model)
- 🗂️ QOI image format for efficient storage
- 📐 Sharp image processing

## 🚀 Quick Installation

1. **📥 Clone and install**
   ```bash
   git clone <repository-url>
   cd meal-tracking-app
   npm install
   ```

2. **⚙️ Set environment variables**
   ```env
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **🗄️ Initialize database and start**
   ```bash
   npm run db:push
   npm run dev
   ```

4. **🌐 Open** http://localhost:5000

## 🎯 Key Features Overview

### 📱 Mobile-First Design
- Responsive UI optimized for mobile food photography
- Touch-friendly interface for rating and navigation
- Fast image upload and processing workflow

### 🔐 Data Management
- Secure database storage with session management
- CRUD operations for restaurants, dishes, and people
- Real-time search and filtering capabilities
- Comprehensive data validation and error handling

### 🚀 Performance Optimized
- QOI format reduces image storage by up to 50% compared to PNG
- TanStack Query for intelligent caching and synchronization
- Optimistic updates for smooth user experience
- Background processing for AI analysis and text correction
- Simplified restaurant selection interface for quick meal logging
- Streamlined user experience focused on core meal tracking functionality

## 📄 License

MIT License

## 👤 Author

**Adam Gąsowski**