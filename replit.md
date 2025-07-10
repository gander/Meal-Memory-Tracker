# Meal Tracking Application

## Overview

This is a full-stack web application for tracking and rating meals at restaurants. Users can upload photos of their meals, rate them across multiple criteria, and view statistics about their dining experiences. The application features AI-powered photo analysis to automatically suggest dish names and ratings.

## User Preferences

Preferred communication style: Simple, everyday language.
Documentation language: English
Author attribution: Adam Gąsowski
Version management: Never display version in README, update only when explicitly requested, maintain English changelog

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
- QOI-format database image storage for efficient compression and fast processing
- Base64 fallback system when QOI processing fails
- Image validation and size limits (5MB max)
- Dynamic image serving via `/api/images/{id}` endpoint
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

### Statistics Simplification (v0.10.0)
- **Problem**: The "W tym miesiącu" (this month) statistics block was not displaying values correctly
- **Solution**: Removed the problematic monthly statistics and simplified the dashboard
- **Changes**:
  - Removed the fourth statistics card showing monthly meal count
  - Updated layout from 4-column to 3-column grid for better presentation
  - Cleaned up component code and removed debugging elements
  - Focus on core metrics: total meals, average rating, and restaurant count
  - Application now has a cleaner, more reliable statistics overview

### GPS Functionality Removal (v0.9.0)
- **Problem**: GPS functionality was causing severe browser freezing and infinite loops, making the application unusable
- **Solution**: Completely removed all GPS-related code from the application
- **Changes**:
  - Removed geolocation hooks and distance calculation utilities
  - Eliminated GPS status indicators and proximity sorting from forms
  - Simplified restaurant selection to alphabetical sorting only
  - Cleaned up all GPS-related imports and dependencies
  - Removed location-based restaurant filtering and distance displays
  - Deleted LocationPicker component and use-geolocation hooks
  - Removed GPS-related state management from all components
  - Application now runs smoothly without GPS-related performance issues

### Complete People Selection in Edit Dialog (v0.7.0)
- **Problem**: Users could not manage people selection when editing existing meals
- **Solution**: Implemented full people selection functionality in meal edit dialog matching add meal form
- **Features**:
  - Select from existing people with interactive button interface
  - Create new people directly from edit dialog with real-time database updates
  - Remove people from meals with visual badge interface
  - Form validation and proper state management for people arrays
  - Consistent UI/UX between add meal and edit meal workflows
  - Database integrity with foreign key constraint handling
  - Cache invalidation and optimistic updates for smooth user experience

### QOI Database Image Storage (v0.6.0)
- **Problem**: File-based image storage was complex and not portable across environments
- **Solution**: Implemented QOI (Quite OK Image Format) for efficient database storage of meal photos
- **Features**:
  - QOI-format compression for faster encoding/decoding than traditional formats
  - Direct database storage eliminating file system dependencies
  - Automatic fallback to base64 when QOI processing fails
  - Dynamic image serving through `/api/images/{id}` endpoint
  - Optimized memory usage with proper Uint8Array handling
  - Backward compatibility with existing image systems
  - Reduced deployment complexity by removing file storage requirements

### Intelligent Text Correction System (v0.5.0)
- **Problem**: Users entering descriptions with typos, missing diacritics, and poor formatting reduced data quality
- **Solution**: Implemented AI-powered automatic text correction for Polish language descriptions
- **Features**:
  - Automatic correction of spelling errors, punctuation, and Polish diacritics
  - Grammar improvements and contextual text fixes
  - Visual correction indicator showing what changes were made
  - Real-time correction during form submission without interrupting user workflow
  - Categorized correction types (spelling, punctuation, diacritics, grammar)
  - Graceful fallback to original text if correction service fails
  - Integration in both add meal and edit meal forms

### Comprehensive GPS Integration (v0.4.0)
- **Problem**: Users needed automatic location tracking for restaurants without complex manual entry
- **Solution**: Implemented complete GPS system with background location capture and editing capabilities
- **Features**:
  - Automatic GPS coordinate capture during restaurant creation
  - Smart permission management with clear user feedback and error handling
  - Background location saving without interrupting user workflow
  - Visual GPS indicators showing location status and accuracy
  - Manual coordinate editing with validation and format checking
  - GPS coordinate display in restaurant lists with precision formatting
  - LocationPicker component with geolocation API integration

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