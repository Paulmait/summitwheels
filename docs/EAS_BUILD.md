# EAS Build Guide - Summit Wheels

## Prerequisites

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

3. Configure your project (first time only):
   ```bash
   eas build:configure
   ```

## Build Profiles

### Development Build
For testing on physical devices with hot reload:

```bash
eas build -p ios --profile development
```

This creates a development build that:
- Includes Expo Dev Client
- Can connect to your local Metro bundler
- Requires Apple Developer account

### Preview Build
For internal testing (TestFlight):

```bash
eas build -p ios --profile preview
```

This creates a build suitable for:
- TestFlight distribution
- Internal team testing
- Pre-release validation

### Production Build
For App Store submission:

```bash
eas build -p ios --profile production
```

This creates an optimized build:
- Minified and bundled
- Ready for App Store review
- No development tools included

## Build Without Mac

EAS allows building iOS apps without a Mac. The build happens in the cloud.

### Required Setup

1. **Apple Developer Account** ($99/year)
   - Needed for signing certificates
   - Create at developer.apple.com

2. **Apple Credentials**
   - EAS will prompt for Apple ID
   - Can generate certificates automatically
   - Or use existing distribution certificate

### First Build Process

```bash
# Start the build
eas build -p ios --profile development

# EAS will ask:
# 1. Apple ID credentials
# 2. Whether to create new certificates
# 3. Bundle identifier confirmation

# Build takes ~15-30 minutes
# You'll receive a download link when complete
```

## Installing on Device

### Development/Preview Builds

1. Build completes → Download IPA
2. Install via:
   - EAS: `eas build:run -p ios` (if connected)
   - Apple Configurator 2
   - TestFlight (preview builds)

### TestFlight Distribution

1. Submit build: `eas submit -p ios`
2. Wait for Apple processing (~30 min)
3. Add testers in App Store Connect
4. Testers install via TestFlight app

## Troubleshooting

### "Missing provisioning profile"
```bash
eas credentials
# Select iOS → Provisioning Profile → Generate new
```

### "Invalid bundle identifier"
Ensure `app.config.ts` bundle identifier matches App Store Connect.

### "Build failed"
Check build logs:
```bash
eas build:list
# Copy build ID
eas build:view [BUILD_ID]
```

## Useful Commands

```bash
# List recent builds
eas build:list

# Cancel a running build
eas build:cancel [BUILD_ID]

# View build details
eas build:view [BUILD_ID]

# Submit to App Store
eas submit -p ios --latest

# Manage credentials
eas credentials
```

## CI/CD Integration

For automated builds, add to your CI:

```yaml
# GitHub Actions example
- name: Build iOS
  run: |
    npm install -g eas-cli
    eas build -p ios --profile production --non-interactive
  env:
    EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```
