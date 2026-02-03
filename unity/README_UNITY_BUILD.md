# Summit Wheels - Unity Version Build Guide

## Quick Start for Android (Windows)

Since you have Windows with Unity and Android Studio installed, you can build directly for Android.

### Prerequisites

1. **Unity 2022 LTS or newer** - Download from [Unity Hub](https://unity.com/download)
2. **Android Studio** - Already installed
3. **Android SDK** - Should be installed with Android Studio
4. **JDK** - Unity typically bundles this

### Step 1: Open the Project in Unity

1. Open Unity Hub
2. Click "Add" and navigate to: `unity/SummitWheels`
3. Select the folder and click "Open"
4. Unity will import all scripts and assets

### Step 2: Install Required Packages

Unity should auto-import these, but verify in Window > Package Manager:
- TextMeshPro (for UI text)
- 2D Animation
- Unity Purchasing (for IAP)
- Input System

### Step 3: Configure Android Build Settings

1. Go to **File > Build Settings**
2. Select **Android** from the platform list
3. Click **Switch Platform**
4. Click **Player Settings** and configure:

   **Company Name:** SummitWheels
   **Product Name:** Summit Wheels
   **Package Name:** com.summitwheels.game
   **Version:** 1.0.0
   **Bundle Version Code:** 1

   **Minimum API Level:** Android 7.0 (API 24)
   **Target API Level:** Android 14 (API 34)
   **Scripting Backend:** IL2CPP
   **Target Architectures:** ARMv7, ARM64

### Step 4: Set Up Android SDK in Unity

1. Go to **Edit > Preferences > External Tools**
2. Point to your Android SDK path (usually `C:\Users\[YourName]\AppData\Local\Android\Sdk`)
3. Point to your JDK (Unity usually handles this)

### Step 5: Create Required Assets

Before building, create these ScriptableObject assets:

1. **Right-click in Assets > Create > Summit Wheels > Vehicle Database**
   - Name it "VehicleDatabase"
   - Right-click and select "Create Default Vehicles"

2. **Right-click in Assets > Create > Summit Wheels > Stage Database**
   - Name it "StageDatabase"
   - Right-click and select "Create Default Stages"

3. **Right-click in Assets > Create > Summit Wheels > Achievement Database**
   - Name it "AchievementDatabase"
   - Right-click and select "Create Default Achievements"

### Step 6: Create the Main Scene

1. Create a new scene: **File > New Scene**
2. Add an empty GameObject named "GameManager"
3. Attach these components:
   - GameManager
   - SaveManager
   - InputManager
   - DailyChallengeSystem
   - AchievementSystem
4. Assign the database references in GameManager

### Step 7: Build APK for Testing

1. Go to **File > Build Settings**
2. Click **Build**
3. Choose a location for the APK
4. Install on your Android device for testing

### Step 8: Build AAB for Play Store

1. Go to **File > Build Settings**
2. Check **Build App Bundle (Google Play)**
3. Click **Build**
4. Upload the .aab file to Google Play Console

---

## Project Structure

```
unity/SummitWheels/
├── Assets/
│   ├── Scripts/
│   │   ├── Core/
│   │   │   ├── GameManager.cs      # Main game controller
│   │   │   ├── SaveManager.cs      # Save/load system with security
│   │   │   └── InputManager.cs     # Touch/keyboard input
│   │   ├── Vehicle/
│   │   │   ├── VehicleController.cs # Physics-based vehicle
│   │   │   └── WheelController.cs   # Wheel physics
│   │   ├── Systems/
│   │   │   ├── FuelSystem.cs        # Fuel management
│   │   │   ├── BoostSystem.cs       # Skill-based boost
│   │   │   ├── TrickSystem.cs       # Trick detection
│   │   │   ├── ComboSystem.cs       # Combo multipliers
│   │   │   ├── AchievementSystem.cs # Achievement tracking
│   │   │   ├── DailyChallengeSystem.cs # Daily challenges
│   │   │   ├── GhostSystem.cs       # Ghost racing
│   │   │   └── CoinSystem.cs        # Coin collection
│   │   ├── Terrain/
│   │   │   └── TerrainGenerator.cs  # Procedural terrain
│   │   ├── UI/
│   │   │   ├── HUDController.cs     # In-game HUD
│   │   │   ├── MainMenuUI.cs        # Main menu
│   │   │   ├── GarageUI.cs          # Vehicle selection/upgrades
│   │   │   └── ResultsUI.cs         # Game over screen
│   │   └── Data/
│   │       ├── VehicleData.cs       # Vehicle ScriptableObject
│   │       ├── StageData.cs         # Stage ScriptableObject
│   │       ├── AchievementData.cs   # Achievement ScriptableObject
│   │       ├── VehicleDatabase.cs   # Vehicle collection
│   │       ├── StageDatabase.cs     # Stage collection
│   │       └── AchievementDatabase.cs # Achievement collection
│   ├── Prefabs/                     # Create these manually
│   ├── Scenes/                      # Create MainMenu, Game scenes
│   └── ScriptableObjects/           # Store database assets here
└── ProjectSettings/
```

---

## Key Features Implemented

### 1. Physics-Based Vehicle
- WheelJoint2D for realistic suspension
- Rigidbody2D for physics simulation
- Touch controls (left=brake, right=gas)
- Air control for tricks

### 2. Trick System
- Frontflip/Backflip detection (360° rotation)
- Double flip bonus (720°+)
- Big Air (2+ seconds airtime)
- Perfect landing bonus (within 15° of level)

### 3. Combo System
- Multiplier from 1x to 5x
- 3-second combo window
- Tier bonuses: Nice (5), Great (10), Awesome (15), Legendary (20)

### 4. Boost System
- Skill-based (earned through tricks)
- 1.8x power multiplier
- Passive regeneration
- Cooldown after use

### 5. Daily Challenges
- Random modifiers (low gravity, slippery, etc.)
- Goal types (distance, coins, tricks, airtime)
- Coin rewards

### 6. Save System
- Checksum-based integrity validation
- Coin balance protection
- Vehicle/stage unlocks
- Upgrade progression

---

## Google Play Store Submission

### Required Assets
1. **App Icon:** 512x512 PNG
2. **Feature Graphic:** 1024x500 PNG
3. **Screenshots:** At least 2 phone screenshots
4. **Short Description:** Max 80 characters
5. **Full Description:** Max 4000 characters

### Suggested Description
```
Summit Wheels - The Ultimate Hill Climb Racing Experience!

Master the art of physics-based driving as you conquer challenging terrains, perform epic tricks, and unlock powerful vehicles.

FEATURES:
- 6 Unique Vehicles: Jeep, Monster Truck, Dune Buggy, Tank, Super Car, Moon Rover
- 6 Challenging Stages: Countryside, Desert, Arctic, Forest, Moon, Volcano
- Trick System: Perform flips, combos, and earn massive bonuses
- Daily Challenges: New challenges every day with unique modifiers
- Ghost Racing: Race against your personal best
- Upgrade System: Improve engine, tires, suspension, and fuel tank
- Achievements: 20+ achievements to unlock

Free to play with optional in-app purchases.
```

### Content Rating
- No violence (crashes are not violent)
- No inappropriate content
- Suitable for all ages (ESRB: Everyone)

### Data Safety
- Collects: Game progress (saved locally)
- Does not share data with third parties
- Encryption: Data stored securely on device

---

## Next Steps

1. **Create Vehicle Prefabs:**
   - Import or create 2D sprites for each vehicle
   - Set up WheelJoint2D, Rigidbody2D, colliders

2. **Create UI:**
   - Design using Unity UI system
   - Connect to UI scripts

3. **Add Audio:**
   - Engine sounds
   - Coin pickup sounds
   - Background music

4. **Test on Device:**
   - Build APK
   - Test performance on mid-range Android device
   - Target 60 FPS

5. **Integrate IAP:**
   - Use Unity Purchasing
   - Set up products in Google Play Console
   - Test with license testing

---

## Support

This Unity project mirrors the React Native version. Reference the original TypeScript code in `src/` for business logic details.

Generated: February 2026
