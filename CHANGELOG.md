# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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