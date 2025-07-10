# Meal Tracking Application

## Overview

This is a full-stack web application for tracking and rating meals at restaurants. Users can upload photos of their meals, rate them across multiple criteria, and view statistics about their dining experiences. The application features AI-powered photo analysis to automatically suggest dish names and ratings.

## User Preferences

Preferred communication style: Simple, everyday language.
Documentation language: English
Author attribution: Adam Gąsowski
Version management: Current version 0.3.0, update only when explicitly requested, maintain English changelog

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with file upload support
- **File Handling**: Multer for image upload processing
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: Express sessions with PostgreSQL store

### Key Components

#### Database Schema
- **restaurants**: Restaurant information (name, address)
- **dishes**: Dish catalog with categories
- **people**: People who participate in meals
- **meals**: Core meal records with ratings and metadata
- **meal_people**: Many-to-many relationship for meal participants

#### Rating System
- Four-dimensional rating scale (-3 to +3) for:
  - Taste quality
  - Visual presentation
  - Value for money
  - Service quality
- Binary flags for "excellent" meals and "want again" preferences

#### AI Integration
- OpenAI GPT-4o integration for photo analysis
- Automatic dish name and category suggestions
- Intelligent rating predictions based on visual analysis
- Polish language support for suggestions

#### File Management
- Local file storage in `/uploads` directory
- Image validation and size limits (5MB max)
- Static file serving for uploaded photos
- Robust image deletion with resilience to missing files
- Automatic cleanup when meals are deleted or photos replaced

## Data Flow

1. **Meal Creation**: User uploads photo → AI analysis → Form pre-population → Manual adjustments → Database storage
2. **Meal Viewing**: Database query → Rating calculations → Statistics aggregation → UI rendering
3. **Search/Filter**: Client-side query parameters → Server-side filtering → Paginated results
4. **Statistics**: Real-time aggregation of meal data for dashboard metrics

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe SQL query builder
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components
- **openai**: AI service integration
- **multer**: File upload handling

### Development Tools
- **drizzle-kit**: Database migrations and schema management
- **tsx**: TypeScript execution for development
- **esbuild**: Production build bundling

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx with live reload
- **Database**: Neon serverless PostgreSQL
- **File Storage**: Local filesystem

### Production
- **Frontend**: Static build served by Express
- **Backend**: Compiled ESM bundle
- **Database**: Neon serverless PostgreSQL (same as dev)
- **File Storage**: Local filesystem (uploads directory)

### Build Process
1. Frontend assets compiled with Vite to `dist/public`
2. Backend compiled with esbuild to `dist/index.js`
3. Single server serves both API and static assets
4. Database migrations applied via `drizzle-kit push`

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: AI service authentication
- `NODE_ENV`: Environment mode (development/production)

## Recent Changes (January 2025)

### AI-Powered Dish Recognition (v0.3.0)
- **Problem**: Manual dish name entry was time-consuming and error-prone
- **Solution**: Implemented automatic dish detection from photos using AI
- **Features**: 
  - AI automatically fills dish names after photo upload
  - Visual indicators with amber highlighting and sparkle icons
  - Confidence-based suggestions with clear AI attribution
  - Focused AI analysis only on food recognition, not restaurants

### Geolocation Restaurant Selection (v0.3.0)
- **Problem**: AI restaurant suggestions from images were inaccurate
- **Solution**: Location-based restaurant suggestions using coordinates
- **Implementation**: 
  - Browser geolocation API integration
  - Permission request with clear user feedback
  - Infrastructure for nearby restaurant suggestions
  - Searchable dropdown with real-time filtering
  - Ability to create new restaurants on-the-fly

### Complete Image CRUD Implementation (v0.2.0)
- **Problem**: Users needed comprehensive image management in meal editing
- **Solution**: Implemented full CRUD operations for images within edit dialog
- **Features**: 
  - View current meal photo in edit dialog
  - Upload new photos with instant preview
  - Delete existing photos with confirmation
  - Replace photos with automatic old file cleanup
  - Memory management for blob URLs to prevent leaks
  - Resilient error handling for missing files

### Previous Changes
- UI layout improvements with button repositioning (v0.2.0)
- Image deletion enhancement with `safeDeleteFile` helper (v0.1.0)
- Portion size field integration across all forms (v0.1.0)

## Key Architectural Decisions

### Database Choice
- **Problem**: Need reliable, scalable database with minimal setup
- **Solution**: Neon serverless PostgreSQL with Drizzle ORM
- **Rationale**: Serverless scaling, strong typing, minimal configuration

### AI Integration Strategy
- **Problem**: Manual dish categorization is time-consuming
- **Solution**: OpenAI GPT-4o for automatic photo analysis
- **Rationale**: Latest vision model with multilingual support

### File Storage Approach
- **Problem**: Need simple image storage for meal photos
- **Solution**: Local filesystem with Express static serving
- **Rationale**: Simple deployment, no external dependencies

### State Management Pattern
- **Problem**: Complex server state synchronization
- **Solution**: TanStack Query for caching and synchronization
- **Rationale**: Automatic background updates, optimistic updates, error handling

### Rating System Design
- **Problem**: Need nuanced meal evaluation beyond simple stars
- **Solution**: Multi-dimensional scale with binary preference flags
- **Rationale**: More detailed feedback, better recommendation data