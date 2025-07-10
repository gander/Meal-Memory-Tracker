# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2025-01-10

### Added
- **Enhanced GPS Location System**: Comprehensive GPS functionality with automatic location requests and visual status indicators
  - Automatic GPS location request on form load for immediate proximity sorting
  - Visual GPS status indicators with color-coded icons (green/red/yellow)
  - Manual GPS refresh button with loading animation and error handling
  - Real-time location accuracy display with meter precision
  - Clear user feedback for permission states and location errors
  - Proximity sorting notification when GPS coordinates are available

### Enhanced
- Both add meal and edit meal forms now actively request current GPS coordinates
- Restaurant selection dropdowns automatically sort by distance when GPS is active
- Improved user experience with clear location status and manual control options
- Enhanced geolocation hook with configurable options for accuracy and timeout

### Technical Implementation
- Enhanced `useGeolocation` hook with automatic location requests and permission management
- Added GPS status component with visual indicators and manual refresh functionality
- Implemented proximity-based restaurant sorting with distance calculations
- Added comprehensive error handling and user feedback for location services
- Consistent GPS integration across all meal management forms

## [0.7.0] - 2025-01-10

### Added
- **Complete People Selection in Edit Dialog**: Full people management functionality in meal edit dialog
  - Select from existing people or create new ones directly in edit dialog
  - Visual people selection with interactive buttons and badges
  - People removal functionality with one-click delete from meal
  - Form validation and database integration for people management
  - Consistent UI/UX matching the add meal form experience

### Enhanced
- Meal edit dialog now provides complete CRUD functionality for all meal properties
- People selection workflow unified across add and edit meal forms
- Database integrity maintained with proper foreign key handling

### Technical Implementation
- Added `useQuery` hook for fetching people in edit dialog
- Implemented `createPersonMutation` for real-time person creation
- Enhanced form schema validation with `peopleNames` array field
- Proper state management for people selection and form updates
- Cache invalidation and optimistic updates for smooth user experience

## [0.6.0] - 2025-01-10

### Added
- **QOI Database Image Storage**: Efficient database storage system for meal photos using QOI format
  - QOI (Quite OK Image Format) compression for faster encoding/decoding than traditional formats
  - Direct database storage eliminating file system dependencies
  - Automatic fallback to base64 when QOI processing fails
  - Dynamic image serving through `/api/images/{id}` endpoint
  - Optimized memory usage with proper Uint8Array handling
  - Backward compatibility with existing image systems

### Changed
- Replaced file-based image storage with database storage for improved portability
- Images now stored in `meals` table with `imageData`, `imageWidth`, and `imageHeight` fields
- Image serving moved from static file serving to dynamic endpoint processing

### Technical Implementation
- New `QOIImageService` class for QOI encoding/decoding operations
- Enhanced image upload processing with QOI conversion and base64 fallback
- Updated storage layer to handle both QOI and legacy image formats
- Improved error handling and debugging for image processing failures
- Memory-efficient image processing with proper buffer management

### Fixed
- Resolved image display issues in frontend when QOI processing fails
- Improved error handling for unsupported image formats
- Fixed Uint8Array conversion issues for QOI encoding

## [0.5.0] - 2025-01-10

### Added
- **AI-Powered Text Correction**: Automatic correction of Polish language descriptions for improved data quality
  - Real-time spelling, punctuation, and diacritics correction
  - Grammar improvements and contextual text fixes
  - Visual indicator showing correction details with categorized changes
  - Integration in both add meal and edit meal forms
  - Graceful error handling with fallback to original text

### Technical Implementation
- New `/api/correct-text` endpoint for text correction processing
- `useTextCorrection` hook for frontend text correction functionality
- `TextCorrectionIndicator` component with Polish language labels
- Enhanced OpenAI service with `correctDescription` method
- Automatic text correction during form submission workflow

## [0.4.0] - 2025-01-10

### Added
- Comprehensive GPS integration system with automatic location capture
- LocationPicker component with geolocation permissions management
- Background GPS coordinate saving during restaurant creation
- Manual GPS coordinate editing with validation and error handling
- Visual GPS indicators showing location status and accuracy in UI
- GPS coordinate display in restaurant management with precision formatting
- Smart permission handling with clear user feedback for denied/blocked access

### Enhanced
- Restaurant creation workflow now automatically captures GPS coordinates
- Restaurant management interface includes GPS editing capabilities
- Location-based features infrastructure for future nearby restaurant suggestions

## [0.3.0] - 2025-01-10

### Added
- Automatic dish name detection from photos using AI
- Geolocation-based restaurant suggestions
- Interactive restaurant dropdown with search and creation
- Location permission request for nearby restaurant suggestions
- Visual indicators for AI-detected dish names (amber highlighting, sparkle icons)

### Changed
- AI analysis now focuses solely on dish recognition, not restaurant suggestions
- Restaurant selection moved to geolocation-based approach instead of image analysis
- Enhanced user interface with clearer separation of AI vs manual inputs
- Improved restaurant management with real-time search and filtering

### Improved
- More accurate dish name detection with confidence indicators
- Better user experience for restaurant selection
- Cleaner separation of AI capabilities vs location services
- Enhanced form validation and user feedback

### Technical
- Refactored AI service to remove restaurant suggestions from image analysis
- Added geolocation API integration for coordinate-based suggestions
- Enhanced restaurant dropdown component with Command UI
- Improved state management for location permissions

## [0.2.0] - 2025-01-10

### Added
- Complete image CRUD functionality in meal editing
- Photo upload, preview, and replacement in edit dialog
- Safe image deletion with confirmation dialogs
- Automatic cleanup of old images when replaced
- Memory management for image preview URLs

### Improved
- Enhanced UI layout to prevent button collisions
- Moved edit button from meal card bottom to header area
- Added proper spacing around floating action button
- Better visual hierarchy in meal cards
- Improved user experience for image management

### Fixed
- Collision between meal edit button and floating add button
- Image file accumulation on server storage
- Missing file handling in deletion operations
- Memory leaks from blob URLs in image previews

### Technical
- Robust file deletion with graceful error handling
- Enhanced server-side image management
- Client-side state management for image operations
- Improved form validation and error handling

## [0.1.0] - 2025-07-10

### Added
- Initial release of meal tracking application
- AI-powered photo analysis using OpenAI GPT-4o
- Multi-dimensional rating system (taste, presentation, value, service)
- Restaurant and dish management with auto-suggestions
- People tagging for meal participants
- Search and filtering capabilities
- Statistics dashboard with meal trends
- Polish language support for AI suggestions
- Photo upload with validation and storage
- Responsive UI with dark/light theme support
- PostgreSQL database with Drizzle ORM
- RESTful API with Express.js backend
- React frontend with TypeScript and Tailwind CSS

### Technical
- Database schema with normalized relationships
- File upload handling with Multer
- Session management with PostgreSQL store
- Type-safe API with Zod validation
- Modern frontend stack with Vite and TanStack Query