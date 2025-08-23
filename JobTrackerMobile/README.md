# Job Tracker Mobile App

A React Native Expo mobile application for tracking job applications that shares the same Firebase database with the Job Application Tracker web app.

## Features

- **Firebase Authentication**: Secure login and registration with Firebase Auth
- **Job Applications**: View, create, edit, and delete job applications
- **Real-time Sync**: Automatic synchronization with the web app via Firebase
- **Statistics**: Overview of application status distribution
- **Search & Filter**: Find applications by company, position, or location
- **Shared Database**: Uses the same Firebase Firestore database as the web app
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

## Firebase Configuration

The mobile app is configured to use the same Firebase project as your web app:

- **Project ID**: jobflow-8bf97
- **Authentication**: Firebase Auth with AsyncStorage persistence
- **Database**: Firestore with the same collections (`users`, `jobApplications`, `userSettings`)
- **Real-time Updates**: Automatic synchronization between web and mobile apps

## Key Features

### Shared Data
- Both web and mobile apps read from and write to the same Firestore collections
- Changes made in one app are immediately reflected in the other
- User authentication is shared between platforms

### Real-time Synchronization
- Uses Firestore real-time listeners for instant updates
- No need for manual refresh - data updates automatically
- Offline support through Firebase's built-in caching

## Data Flow

1. **Authentication**: Users can log in with the same credentials on both web and mobile
2. **Job Applications**: Create, read, update, delete operations sync across platforms
3. **Real-time Updates**: Changes are pushed to all connected clients instantly
4. **Offline Support**: Firebase handles offline scenarios automatically

## Security

The mobile app uses the same Firestore security rules as the web app:
- Users can only access their own data
- Row-level security ensures data privacy
- Firebase Auth handles secure authentication
## Project Structure

```
JobTrackerMobile/
├── config/              # Firebase configuration
│   └── firebase.ts
├── components/           # Reusable UI components
│   ├── JobApplicationCard.tsx
│   └── StatsOverview.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx
├── screens/             # Screen components
│   ├── AddApplicationScreen.tsx
│   ├── HomeScreen.tsx
│   └── LoginScreen.tsx
├── services/            # API and data services
│   ├── firebaseAuthService.ts
│   └── firebaseJobApplicationService.ts
├── types/               # TypeScript type definitions
│   ├── JobApplication.ts
│   └── User.ts
└── App.tsx             # Main app component
```

## Key Components

### AuthContext
Manages user authentication state using Firebase Auth with real-time listeners.

### Firebase Services
- **firebaseAuthService**: Handles authentication with Firebase Auth
- **firebaseJobApplicationService**: Manages job applications in Firestore with real-time updates
### JobApplicationCard
Displays individual job application information with actions for edit/delete.

### StatsOverview
Shows statistics about job applications (total, applied, interviews, etc.).

## Development Notes

- The app uses Firebase for authentication and data storage
- Real-time listeners provide automatic updates
- Firebase handles offline scenarios and data caching
- The UI follows iOS/Android design guidelines
- All components are fully typed with TypeScript
- Data is automatically synchronized with the web app

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
4. Ensure Firebase security rules are properly configured
4. Update this README for any new features or configuration changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.