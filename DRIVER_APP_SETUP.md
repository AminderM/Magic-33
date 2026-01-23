# Driver App - Complete Setup Guide

## Overview
The Driver App is a React Native mobile application for Android and iOS that syncs with the Transportation Management System (TMS). It enables drivers to receive dispatch assignments, update load status in real-time, and navigate routes with GPS.

## Architecture

### Backend (FastAPI)
- New API routes created at `/app/backend/routes/driver_app_routes.py`
- Endpoints prefixed with `/api/driver/`
- Integrated with existing MongoDB database
- JWT authentication for secure access

### Frontend (React Native)
- Complete mobile app at `/app/mobile/`
- TypeScript-based codebase
- React Navigation for routing
- Axios for API calls
- React Native Maps for navigation

## Setup Requirements

### For Development Team
1. **Node.js**: v16 or higher
2. **Yarn**: Package manager
3. **For Android Development**:
   - Android Studio
   - Android SDK (API level 28+)
   - Java Development Kit (JDK 11+)
4. **For iOS Development** (Mac only):
   - Xcode 12+
   - CocoaPods
   - iOS Simulator or physical iOS device

## Installation Steps

### 1. Install Dependencies
```bash
cd /app/mobile
yarn install
```

### 2. iOS Setup (Mac only)
```bash
cd ios
pod install
cd ..
```

### 3. Android Setup
- Open Android Studio
- Configure Android SDK
- Create an emulator or connect a physical device

## Running the App

### Development Mode

#### Start Metro Bundler
```bash
cd /app/mobile
yarn start
```

#### Run on Android
In a new terminal:
```bash
cd /app/mobile
yarn android
```

Or via Android Studio:
1. Open `/app/mobile/android` folder
2. Click Run button
3. Select emulator or device

#### Run on iOS (Mac only)
In a new terminal:
```bash
cd /app/mobile
yarn ios
```

Or via Xcode:
1. Open `/app/mobile/ios/DriverApp.xcworkspace`
2. Select simulator
3. Click Play button

## Features Implemented

### Phase 1 (Current)

#### Authentication
- **Driver Login**: Fleet drivers login with company-assigned email
- **Owner-Operator Signup**: Independent drivers can create accounts
- JWT token-based authentication
- Persistent session storage

#### Load Management
- **View Assigned Loads**: See all loads assigned to the driver
- **Load Details**: View complete information about each load
- **Accept Loads**: Confirm load assignments
- **Update Status**: Real-time status updates through the load lifecycle

#### Navigation
- **Route Visualization**: View pickup and delivery locations on map
- **GPS Navigation**: Get turn-by-turn directions
- **External Navigation**: Launch Google Maps or Apple Maps

#### Profile Management
- View driver profile information
- See company details (for fleet drivers)
- Check account status

### Load Status Flow
```
pending → planned → in_transit_pickup → at_pickup → in_transit_delivery → at_delivery → delivered
```

## API Endpoints

Base URL: `https://logistics-nano.emergent.host`

### Driver App Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/driver/login` | Driver login |
| POST | `/api/driver/signup` | Owner-operator registration |
| GET | `/api/driver/profile` | Get driver profile |
| GET | `/api/driver/loads` | Get assigned loads |
| GET | `/api/driver/loads/:id` | Get load details |
| POST | `/api/driver/loads/:id/accept` | Accept load assignment |
| PUT | `/api/driver/loads/:id/status` | Update load status |
| POST | `/api/driver/loads/:id/location` | Update driver location |
| GET | `/api/driver/loads/:id/route` | Get route information |

## Database Collections

### users
Drivers are stored with:
- `role`: "driver"
- `fleet_owner_id`: Reference to company owner (or null for owner-operators)
- `email`, `full_name`, `phone`, `password_hash`

### bookings
Loads/orders with:
- `driver_id`: Assigned driver
- `status`: Current status in the flow
- Pickup and delivery information
- Route details

## Building for Production

### Android APK

1. **Generate Release Key** (first time only):
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore driver-app-release.keystore -alias driver-app -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure Signing**:
Edit `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('driver-app-release.keystore')
            storePassword 'YOUR_PASSWORD'
            keyAlias 'driver-app'
            keyPassword 'YOUR_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

3. **Build APK**:
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### iOS IPA (Mac only)

1. **Configure Signing**:
   - Open project in Xcode
   - Select project in navigator
   - Go to Signing & Capabilities
   - Select your team and configure signing

2. **Archive**:
   - Product → Archive
   - Wait for build to complete

3. **Export IPA**:
   - Click "Distribute App"
   - Choose distribution method
   - Export IPA file

## Deployment

### Google Play Store (Android)
1. Create developer account ($25 one-time fee)
2. Create new app listing
3. Upload APK/AAB
4. Complete store listing
5. Submit for review

### Apple App Store (iOS)
1. Enroll in Apple Developer Program ($99/year)
2. Create app in App Store Connect
3. Upload IPA via Xcode or Transporter
4. Complete app metadata
5. Submit for review

## Environment Configuration

### API URL
The app is configured to connect to:
```typescript
const API_URL = 'https://logistics-nano.emergent.host';
```

To change for different environments, edit `/app/mobile/src/utils/api.ts`

## Testing

### Test Credentials

**Fleet Driver**:
- Email: (Create via TMS Drivers page)
- Password: (Set by fleet owner)

**Owner-Operator**:
- Use the signup flow in the app
- Account pending verification

### Test Flow
1. Login with driver credentials
2. View assigned loads
3. Accept a load
4. Update status through the flow
5. Use navigation to view route
6. Complete delivery

## Troubleshooting

### Common Issues

**Metro bundler not starting**:
```bash
yarn start --reset-cache
```

**Android build fails**:
```bash
cd android
./gradlew clean
cd ..
yarn android
```

**iOS build fails**:
- Clean build folder: Shift + Cmd + K in Xcode
- Delete derived data
- Reinstall pods:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

**Dependencies issues**:
```bash
rm -rf node_modules yarn.lock
yarn install
```

**Android signing issues**:
- Verify keystore path in build.gradle
- Check keystore password
- Ensure keystore file exists

## Next Steps (Phase 2)

Future enhancements may include:
- Push notifications for new load assignments
- Offline mode support
- Proof of delivery (POD) capture
- Digital signature collection
- Chat with dispatcher
- ELD integration
- Driver performance analytics

## Product Listing

The Driver App is now available as a product in the Admin Console:
- **Product Name**: Driver App
- **Price**: Free
- **Requirement**: Active TMS subscription
- **Platforms**: Android & iOS

## Support

For technical issues or questions:
1. Check this documentation
2. Review backend logs at `/var/log/supervisor/backend.*.log`
3. Check mobile app console logs
4. Test API endpoints using curl

## Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Android Studio Guide](https://developer.android.com/studio)
- [Xcode Guide](https://developer.apple.com/xcode/)
