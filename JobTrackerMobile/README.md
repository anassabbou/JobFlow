# Job Tracker Mobile App

A React Native Expo mobile application for tracking job applications, designed to work with the Job Application Tracker web app.

## Features

- **Authentication**: Login and registration with secure token storage
- **Job Applications**: View, create, edit, and delete job applications
- **Statistics**: Overview of application status distribution
- **Search & Filter**: Find applications by company, position, or location
- **Offline Support**: Basic offline functionality with AsyncStorage
- **Responsive Design**: Optimized for mobile devices

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. Navigate to the mobile app directory:
   ```bash
   cd JobTrackerMobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Use the Expo Go app on your phone to scan the QR code, or press `i` for iOS simulator or `a` for Android emulator.

## Configuration

### API Integration

To connect to your web app's API:

1. Update the `API_BASE_URL` in `services/apiService.ts`:
   ```typescript
   const API_BASE_URL = 'https://your-web-app-domain.com/api';
   ```

2. Uncomment the real API calls in:
   - `contexts/AuthContext.tsx` (login/register methods)
   - `screens/HomeScreen.tsx` (loadApplications method)
   - `services/apiService.ts` (remove mock methods)

### Firebase Integration (Optional)

If your web app uses Firebase, you can integrate Firebase SDK:

1. Install Firebase:
   ```bash
   npm install firebase
   ```

2. Add your Firebase configuration to a new `config/firebase.ts` file
3. Update the API service to use Firebase directly

## Project Structure

```
JobTrackerMobile/
├── components/           # Reusable UI components
│   ├── JobApplicationCard.tsx
│   └── StatsOverview.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx
├── screens/             # Screen components
│   ├── HomeScreen.tsx
│   └── LoginScreen.tsx
├── services/            # API and data services
│   └── apiService.ts
├── types/               # TypeScript type definitions
│   ├── JobApplication.ts
│   └── User.ts
└── App.tsx             # Main app component
```

## Key Components

### AuthContext
Manages user authentication state and provides login/logout functionality.

### JobApplicationCard
Displays individual job application information with actions for edit/delete.

### StatsOverview
Shows statistics about job applications (total, applied, interviews, etc.).

### ApiService
Handles all API communication with the web app backend.

## Development Notes

- The app currently uses mock data for development
- AsyncStorage is used for local data persistence
- The UI follows iOS/Android design guidelines
- All components are fully typed with TypeScript

## Building for Production

### iOS

1. Build the app:
   ```bash
   npx expo build:ios
   ```

2. Follow Expo's documentation for App Store submission

### Android

1. Build the app:
   ```bash
   npx expo build:android
   ```

2. Follow Expo's documentation for Google Play Store submission

## Contributing

1. Follow the existing code style and structure
2. Add proper TypeScript types for new features
3. Test on both iOS and Android platforms
4. Update this README for any new features or configuration changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.