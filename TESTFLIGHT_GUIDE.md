# TestFlight Deployment Guide

## Prerequisites

1. **Apple Developer Account** (paid, $99/year)
2. **App ID created** in Apple Developer Console
3. **Signing certificates** and provisioning profiles configured
4. **EAS account** (free, at Expo.dev)

## Step 1: Configure EAS Build

Update `eas.json` with your App Store credentials:

```bash
eas credentials
# Select iOS
# Upload or create signing certificate
# Upload or create provisioning profile
```

## Step 2: Create App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Name**: PinkBook
   - **Bundle ID**: com.pinkbook.app (matches app.json)
   - **SKU**: pinkbook-ios-2026
   - **Platforms**: iOS
4. Click **Create**

## Step 3: Add App Information

In App Store Connect → PinkBook:

- **General Information**
  - Category: Business
  - Subtitle: Schedule & manage bookings

- **App Preview & Screenshots**
  - Add screenshots from iPhone 14 Pro (5.5" display)
  - Screenshot 1: Main booking interface
  - Screenshot 2: Camera capture flow
  - Screenshot 3: AI-powered chat

- **Description**
  ```
  PinkBook is your all-in-one booking and scheduling platform 
  with AI-powered photo intelligence for service businesses.
  
  Features:
  - Instant booking scheduling
  - Photo capture and analysis
  - AI-powered client recommendations
  - Push notifications for waitlist updates
  - Offline access to bookings
  ```

- **Keywords**: booking, scheduling, salon, spa, photography, AI

- **Support URL**: https://www.pinkbook.app/support

- **Privacy Policy URL**: https://www.pinkbook.app/privacy

## Step 4: Build for TestFlight

```bash
cd pinkbook-native

# Build for App Store
eas build --platform ios --profile production

# Or submit directly to TestFlight
eas build --platform ios --profile production
eas submit --platform ios
```

During build, provide:
- Apple ID: your@email.com
- App Specific Password (generate at appleid.apple.com)

## Step 5: Submit to TestFlight

```bash
# Option A: Manual submission in App Store Connect
# 1. Go to TestFlight tab
# 2. Click "+" to add build
# 3. Select the build from EAS
# 4. Add internal testers (emails)

# Option B: Automatic submission (recommended)
eas submit --platform ios --profile production
```

## Step 6: Add TestFlight Testers

In App Store Connect → TestFlight → Internal Testing:

1. Click **"+"** to add testers
2. Enter email addresses:
   - Your test accounts
   - Team members
   - Beta users (up to 10 internal, 10,000 external)

3. Send invitation link to testers
4. Testers download TestFlight app on iOS
5. Enter redemption code to join beta

## Step 7: Monitor TestFlight Beta

- **Feedback**: Testers submit crash reports and feedback
- **Metrics**: View session length, device types, crashes
- **Versions**: Keep multiple versions available for testing

Common TestFlight issues:
- Build takes 10-30 minutes to process
- Test flight app must be installed separately
- Testers need iOS 14+ devices
- Builds expire after 90 days

## Step 8: Move to Production

Once TestFlight testing is complete:

1. In App Store Connect, click **Prepare for Submission**
2. Add **Release Notes**: "PinkBook iOS Beta - Initial Release"
3. Set **Age Rating**
4. Review **Licensing & Pricing** (set to Free)
5. Click **Submit for Review**

Apple Review typically takes 24-48 hours.

## Build Script (npm)

Add to `package.json`:

```json
{
  "scripts": {
    "build:ios": "eas build --platform ios --profile production",
    "submit:testflight": "eas submit --platform ios --profile production",
    "submit:appstore": "eas submit --platform ios --profile production --type app-store"
  }
}
```

Then:
```bash
npm run build:ios
npm run submit:testflight
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid provisioning profile" | Re-run `eas credentials` |
| "Build stuck" | Check EAS build logs online |
| "Testers can't download" | Ensure TestFlight invite email sent |
| "App crashes on TestFlight" | Check logs in Xcode organizer |

## Security Notes

- Never commit `.env` files to git
- Use EAS secrets for API keys:
  ```bash
  eas secret create ANTHROPIC_API_KEY
  ```
- Rotate API keys regularly
- Review privacy policy with legal team

## Next Steps (Post-Launch)

- [ ] Set up crash analytics (Sentry or Bugsnag)
- [ ] Configure push notification campaigns in Firebase
- [ ] Monitor App Store reviews and ratings
- [ ] Plan updates for iOS 19+ compatibility
