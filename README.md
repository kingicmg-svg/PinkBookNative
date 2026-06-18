# PinkBook Native App

iOS native app built with Expo, wrapping the PinkBook web platform with native integrations.

## Features

- **WebView Embedding**: Mount existing PinkBook web code with responsive viewport scaling
- **Camera Integration**: Capture photos for booking/portfolio uploads
- **Claude AI Bridge**: Vision analysis, chat, and photo intelligence
- **Push Notifications**: Firebase + APNs for waitlist updates
- **Session Persistence**: AsyncStorage for user state across app background cycles
- **Offline Support**: Cache web assets and session data locally

## Architecture

```
App (Expo + TypeScript)
├── PinkBookWebView (React Native WebView + safe areas)
├── Services
│   ├── CameraService (photo capture + base64 encoding)
│   ├── AIService (Claude API for vision + chat)
│   ├── StorageService (AsyncStorage wrapper)
│   └── NotificationService (Firebase + Expo notifications)
└── Bridge: Native ↔ Web communication via JSON messages
```

## Setup

### Prerequisites
- Expo CLI: `npm install -g expo-cli`
- Node 18+
- Xcode 15+ (for iOS development)
- Apple Developer Account (for TestFlight)

### Installation

```bash
cd pinkbook-native
npm install
cp .env.example .env
# Fill in Firebase & Anthropic credentials
```

### Environment Variables

See `.env.example`. Required:
- `EXPO_PUBLIC_ANTHROPIC_API_KEY` - Claude API key
- `EXPO_PUBLIC_FIREBASE_*` - Firebase project credentials
- `EXPO_PUBLIC_PINKBOOK_API_URL` - PinkBook web app URL (default: https://www.pinkbook.app)

## Development

### Run on Simulator
```bash
npm run ios
```

### Run on Device
```bash
npm run ios -- --device
```

### Debugging
- Open Expo Go on physical device or simulator
- Scan QR code from terminal
- Shake device to open debug menu

## Bridge API

Web code can call native features via `window.NativeBridge`:

```javascript
// Capture photo
const { uri } = await window.NativeBridge.camera.capture();

// Analyze image with Claude
const result = await window.NativeBridge.ai.analyzePhoto(uri, 'Describe this image');

// Chat with AI
const response = await window.NativeBridge.ai.chat([
  { role: 'user', content: 'Hello!' }
]);

// Persistent storage
await window.NativeBridge.storage.set('user-data', { name: 'John' });
const data = await window.NativeBridge.storage.get('user-data');
```

## Firebase Setup

1. Create Firebase project at console.firebase.google.com
2. Enable:
   - Cloud Messaging (for push notifications)
   - Firestore (for waitlist subscriptions)
3. Download APNs certificate from Apple Developer Console
4. Upload to Firebase Console → Cloud Messaging → APNs
5. Copy project credentials to `.env`

## Build & Deploy

### EAS Build (hosted CI/CD)
```bash
eas build --platform ios --profile production
```

### Local Build
```bash
eas build --platform ios --profile production --local
```

### TestFlight Submission
```bash
eas submit --platform ios
# Provide Apple ID credentials and TestFlight recipient emails
```

## Performance Optimization

- **Caching**: DOM storage + WebView cache enabled
- **Background**: AsyncStorage persists session across app minimization
- **Memory**: Photo cleanup, conversation limit (keep last 50 messages)
- **Network**: Retry logic with exponential backoff (3 attempts)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera permission denied | Check Settings → PinkBook → Camera |
| Firebase auth fails | Verify credentials in .env and Firebase Console |
| Claude API errors | Check API key and rate limits |
| WebView blank | Check EXPO_PUBLIC_PINKBOOK_API_URL is correct |

## Next Steps

- [ ] Connect to Firebase Firestore for data sync
- [ ] Implement offline queue for failed operations
- [ ] Add biometric auth (Face ID / Touch ID)
- [ ] Performance profiling on 64GB MacBook Pro VM grid
- [ ] TestFlight beta distribution setup
