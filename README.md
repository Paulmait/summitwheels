# Summit Wheels

A Hill Climb Racing-style mobile game built with Expo, React Native, and Matter.js physics engine.

## Tech Stack

- **Framework:** Expo SDK 52 + React Native
- **Physics:** Matter.js
- **Audio:** expo-av
- **Storage:** AsyncStorage
- **IAP:** expo-iap (iOS/Android)
- **Ads:** expo-ads-admob (rewarded ads)
- **Language:** TypeScript

## Features

### Core Gameplay
- **Physics-based driving** with realistic car body, wheels, and suspension
- **Infinite procedural terrain** with seeded random generation
- **6 unique vehicles** with different stats (Jeep, Monster Truck, Dune Buggy, Tank, Super Car, Moon Rover)
- **6 stages/environments** with different gravity, friction, and coin rates
- **Trick system** - Flips and rotations detected and scored
- **Combo system** - Chain tricks for multipliers (Nice/Great/Awesome/Legendary tiers)
- **Boost system** - Charged by tricks, 3x power when activated
- **Fuel system** - Manage fuel consumption, collect fuel pickups

### Visual Feedback
- **Particle effects** - Dust, landing impacts, explosions, sparkles
- **Floating text** - "+1" coins, "+FUEL", trick names with points
- **Screen shake** - Impact feedback on crashes and hard landings
- **Coin magnet** - Nearby coins attracted toward player
- **Trick popup** - Real-time trick notifications

### Progression System
- **Coin collection** - Earn coins during runs, persisted to wallet
- **Vehicle unlocks** - Purchase new vehicles with coins
- **Stage unlocks** - Purchase new environments with coins
- **Upgrade system** - 4 upgrades per vehicle (Engine, Tires, Suspension, Fuel Tank)
- **10 upgrade levels** per stat with exponential cost scaling

### Daily Challenges
- **12 challenge modifiers** (Moon Mode, Ice Age, Gold Rush, No Brakes, etc.)
- **5 goal types** (Distance, Coins, Tricks, Air Time, No Crash)
- **Daily rotation** with seeded randomization
- **Bonus rewards** for completion

### Achievements (24+ achievements)
- **Distance achievements** - First Steps to Legend (10,000m)
- **Trick achievements** - First Flip to Legendary Combo
- **Collection achievements** - Coin milestones
- **Mastery achievements** - Runs, vehicles, stages
- **Secret achievements** - Hidden challenges

### Monetization
- **In-App Purchases:**
  - Remove Ads ($2.99 lifetime)
  - Coin packs: Small 5,000/$1.99, Medium 15,000/$4.99, Large 40,000/$9.99
- **Rewarded Ads:**
  - Double coins on run end
  - Revive after crash
- **Ad-free experience** for premium users

### Audio System
- **Sound effects** for all interactions (coin pickup, crash, landing, boost, etc.)
- **Background music** with menu and gameplay loops
- **Volume controls** - Separate SFX and music sliders
- **Haptic feedback** on impacts

### Settings & Privacy
- **Audio controls** - SFX toggle, Music toggle, volume sliders
- **Haptics toggle**
- **GDPR/CCPA compliance** - Delete My Data option
- **Privacy Policy & Terms of Service** links
- **EULA acceptance** on first launch

### Ghost Racing System
- **Record runs** frame-by-frame
- **Race against personal best**
- **Distance and time delta display**
- **Replay viewer** with playback controls (play/pause, speed 0.5x/1x/2x)

### New Player Experience
- **Tutorial overlay** - Step-by-step onboarding for first-time players
- **Controls tutorial** - Gas, Brake, Boost button explanation
- **Mechanics tutorial** - Tricks, combos, fuel management
- **Skip option** for returning players

### UI/UX Features
- **Achievements Screen** - View all 24+ achievements with progress bars
- **Unified Shop** - Tabbed interface for Vehicles, Stages, Upgrades, Coin Packs
- **Achievement Toasts** - Animated notifications when achievements unlock
- **UI Sound Effects** - Audio feedback on all button interactions
- **Pause Menu** - Resume, Restart, Quit with confirmation dialog

## Project Structure

```
src/
├── ads/              # Ad service (rewarded ads)
├── audio/            # Audio manager, sound assets
├── components/       # Reusable UI components
├── game/
│   ├── config/       # Vehicle and stage configurations
│   ├── physics/      # Matter.js world and car setup
│   ├── pickups/      # Coin and fuel spawning
│   ├── progression/  # Upgrades and progression manager
│   ├── renderer/     # Game rendering utilities
│   ├── state/        # Run state management
│   ├── systems/      # Game systems (tricks, combo, boost, particles, etc.)
│   └── terrain/      # Procedural terrain generation
├── hooks/            # Custom React hooks
├── i18n/             # Internationalization (English)
├── iap/              # In-app purchase management
├── screens/          # App screens
├── services/         # Data persistence, entitlements
└── types/            # TypeScript type definitions
```

## Scripts

```bash
# Development
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator

# Testing
npm test               # Run Jest tests (446+ tests)
npm run lint           # ESLint check

# Audio Generation
node scripts/generateAudio.js  # Generate placeholder audio files

# Build
eas build --platform ios       # Build for iOS
eas build --platform android   # Build for Android
```

## Test Coverage

- **446+ passing tests**
- Unit tests for all game systems
- Integration tests for IAP flows
- Component tests for screens

## App Store Requirements

### Completed
- [x] EULA acceptance flow
- [x] Privacy Policy integration
- [x] Terms of Service integration
- [x] GDPR/CCPA data deletion
- [x] IAP implementation
- [x] Rewarded ad integration
- [x] Haptic feedback
- [x] Audio system with controls
- [x] Persistent progression
- [x] Multiple vehicles and stages
- [x] Upgrade system
- [x] Achievement system with UI screen
- [x] Achievement unlock notifications (toasts)
- [x] Daily challenges
- [x] Ghost racing system
- [x] Replay viewer with playback controls
- [x] Pause menu with resume/restart/quit options
- [x] Tutorial/onboarding for new players
- [x] Unified shop screen
- [x] UI sound effects on all buttons

### Production Checklist
- [ ] Replace placeholder audio with final assets
- [ ] Add app icons and splash screens
- [ ] Configure App Store metadata
- [ ] Set up App Store Connect / Google Play Console
- [ ] Configure production IAP product IDs
- [ ] Configure production AdMob IDs
- [ ] App Store screenshots
- [ ] Privacy policy hosted URL
- [ ] Terms of service hosted URL

## Development

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- EAS CLI for builds

### Setup
```bash
npm install
npm start
```

### Environment
Create `.env` for production credentials:
```
ADMOB_IOS_APP_ID=ca-app-pub-xxx
ADMOB_ANDROID_APP_ID=ca-app-pub-xxx
```

## Credits

- **Developer:** Cien Rios LLC
- **Physics Engine:** Matter.js
- **Framework:** Expo + React Native

## License

Proprietary - All rights reserved
