# Summit Wheels - Development Log

## Project Overview

**Summit Wheels** is a 2D side-scrolling hill climb racing game built with React Native, Expo SDK 54, and Matter.js physics engine. The game is designed for iOS and Android deployment via EAS Build.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript |
| Physics Engine | Matter.js |
| State Management | React Context + Hooks |
| Persistence | AsyncStorage |
| Build System | EAS Build |
| Testing | Jest |
| Audio | expo-av |

---

## Features Implemented

### Core Gameplay (Foundation)

#### Physics World (`src/game/physics/world.ts`)
- Matter.js physics engine integration
- Configurable gravity and physics parameters
- Body management (add/remove)
- Collision detection system

#### Vehicle System (`src/game/physics/vehicle.ts`)
- Realistic vehicle physics with suspension
- Front and rear wheel constraints
- Engine power and torque application
- Fuel consumption mechanics

#### Terrain Generation (`src/game/terrain/generator.ts`)
- Procedural hill generation using Perlin noise
- Configurable terrain parameters (amplitude, frequency)
- Chunk-based loading for infinite terrain

#### Pickups (`src/game/pickups.ts`)
- Coin pickups with collection detection
- Fuel canister pickups for fuel restoration
- Spawn management and collision handling

---

### Upgrade System (`src/game/progression/upgrades.ts`)

#### Upgrade Types
| Type | Base Cost | Effect | Max Level |
|------|-----------|--------|-----------|
| Engine | 50 coins | +50 power per level | 10 |
| Tires | 40 coins | +0.05 friction per level | 10 |
| Suspension | 45 coins | +0.02 stiffness per level | 10 |
| Fuel Tank | 35 coins | +10 capacity per level | 10 |

#### Cost Formula
```typescript
cost = baseCost * (1.5 ^ currentLevel)
```
Exponential growth ensures meaningful progression.

#### Persistence
- All progress saved to AsyncStorage
- Automatic save on any state change
- Load on app startup

---

### Vehicle Configuration (`src/game/config/vehicles.ts`)

#### Available Vehicles
| Vehicle | Cost | Stars | Engine | Friction | Fuel |
|---------|------|-------|--------|----------|------|
| Jeep | Free | 2 | 800 | 0.8 | 100 |
| Monster Truck | 5,000 | 3 | 1200 | 1.0 | 120 |
| Dune Buggy | 10,000 | 3 | 600 | 0.6 | 80 |
| Tank | 25,000 | 4 | 2000 | 1.2 | 200 |
| Super Car | 50,000 | 4 | 1500 | 0.9 | 90 |
| Moon Rover | 75,000 | 5 | 1000 | 1.1 | 150 |

Each vehicle has unique characteristics:
- **Jeep**: Balanced starter vehicle
- **Monster Truck**: High traction, great for rough terrain
- **Dune Buggy**: Lightweight, quick acceleration
- **Tank**: Heavy and powerful, handles steep hills
- **Super Car**: Fast but requires skill
- **Moon Rover**: Best all-around, unlocked via achievement

---

### Stage Configuration (`src/game/config/stages.ts`)

#### Available Stages
| Stage | Cost | Gravity | Friction | Special |
|-------|------|---------|----------|---------|
| Countryside | Free | 1.0x | 0.8 | Starting stage |
| Desert | 2,500 | 1.0x | 0.5 | Sandy, low friction |
| Arctic | 7,500 | 1.0x | 0.3 | Icy, very slippery |
| Forest | 15,000 | 1.0x | 0.9 | Dense terrain |
| Moon | 20,000 | 0.16x | 0.7 | Low gravity |
| Volcano | 40,000 | 1.2x | 1.0 | Higher gravity |

Each stage has:
- Unique physics modifiers
- Visual theme colors
- Terrain roughness settings
- Pickup spawn multipliers

---

### Tricks System (`src/game/systems/tricks.ts`)

#### Detected Tricks
| Trick | Requirement | Points |
|-------|-------------|--------|
| Frontflip | 360° forward rotation | 100 |
| Backflip | 360° backward rotation | 100 |
| Double Flip | 720° any direction | 300 |
| Big Air | 2+ seconds airtime | 50/sec |
| Perfect Landing | Land within 15° of level | +50 bonus |

#### Implementation Details
- Rotation tracking via accumulated angle changes
- Air time tracking when vehicle is airborne
- Landing angle detection for perfect landings
- Event system for UI notifications

---

### Combo System (`src/game/systems/combo.ts`)

#### Mechanics
- Chain tricks within 3-second windows
- Multiplier increases 0.2x per trick (max 5.0x)
- Tier progression with bonus rewards

#### Combo Tiers
| Tier | Tricks Required | Bonus | Color |
|------|-----------------|-------|-------|
| None | 0 | - | White |
| Nice | 5 | +100 coins | Green |
| Great | 10 | +500 coins | Blue |
| Awesome | 15 | +2000 coins | Purple |
| Legendary | 20 | +10000 coins | Gold |

#### Key Features
- Visual tier labels (NICE!, GREAT!, etc.)
- Combo timer countdown display
- Points multiplied by current multiplier
- Max combo tracking for achievements

---

### Boost System (`src/game/systems/boost.ts`)

#### Mechanics
- Earn boost by performing tricks (skill-based, not purchased)
- Activate for 1.8x engine power
- Strategic resource management

#### Configuration
| Parameter | Value |
|-----------|-------|
| Max Boost | 100 units |
| Gain Rate | 0.2 per trick point |
| Consumption | 30 units/second |
| Regeneration | 2 units/second (idle) |
| Min to Activate | 20 units |
| Cooldown | 1 second after use |

#### Visual Feedback
- Boost bar with percentage fill
- Color states: Cyan (ready), Orange (active), Gray (cooldown)

---

### Daily Challenge System (`src/game/systems/dailyChallenge.ts`)

#### Modifier Types (12 Total)
| Modifier | Effect |
|----------|--------|
| low_gravity | 0.5x gravity |
| high_gravity | 1.5x gravity |
| slippery | 0.5x friction |
| sticky | 1.5x friction |
| double_coins | 2x coin value |
| half_fuel | 0.5x fuel capacity |
| no_brakes | Brakes disabled |
| super_boost | 2x boost power |
| giant_wheels | 1.5x wheel size |
| tiny_vehicle | 0.7x vehicle scale |
| reverse_controls | Inverted controls |
| fog | Limited visibility |

#### Goal Types
| Goal | Description |
|------|-------------|
| distance | Reach X meters |
| coins | Collect X coins |
| tricks | Perform X tricks |
| airtime | Accumulate X seconds |
| no_crash | Complete without crashing |

#### Features
- Deterministic generation from date seed
- 1-3 random modifiers per challenge
- Tiered rewards based on difficulty
- Streak tracking for consecutive completions

---

### Ghost Racing System (`src/game/systems/ghost.ts`)

#### GhostRecorder
- Records player position, rotation, velocity
- 10 FPS sample rate (100ms intervals)
- Automatic compression for storage
- Start/stop/pause controls

#### GhostPlayer
- Plays back recorded ghost data
- Interpolates between keyframes
- Semi-transparent visual representation
- Time delta display (+/- seconds vs ghost)

#### Data Structure
```typescript
type GhostKeyframe = {
  time: number;
  x: number;
  y: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
};
```

---

### Achievement System (`src/game/systems/achievements.ts`)

#### Categories
1. **Distance** - Travel milestones
2. **Tricks** - Trick performance
3. **Collection** - Coin gathering
4. **Mastery** - Game completion
5. **Secret** - Hidden achievements

#### All Achievements (23 Total)

##### Distance Category
| ID | Name | Target | Reward | Tier |
|----|------|--------|--------|------|
| first_steps | First Steps | 100m | 100 | Bronze |
| going_places | Going Places | 500m | 250 | Bronze |
| marathon | Marathon | 1000m | 500 | Silver |
| explorer | Explorer | 5000m | 1000 | Gold |
| legend | Legend | 10000m | 5000 + Moon Rover | Platinum |

##### Tricks Category
| ID | Name | Target | Reward | Tier |
|----|------|--------|--------|------|
| first_flip | First Flip | 1 flip | 100 | Bronze |
| flip_master | Flip Master | 50 flips | 500 | Silver |
| air_time | Air Time | 60s total | 300 | Silver |
| combo_starter | Combo Starter | 5 combo | 200 | Bronze |
| combo_king | Combo King | 20 combo | 2000 | Gold |

##### Collection Category
| ID | Name | Target | Reward | Tier |
|----|------|--------|--------|------|
| coin_collector | Coin Collector | 1000 | 100 | Bronze |
| treasure_hunter | Treasure Hunter | 10000 | 500 | Silver |
| wealthy | Wealthy | 50000 | 1000 | Gold |
| tycoon | Tycoon | 100000 | 5000 | Platinum |

##### Mastery Category
| ID | Name | Target | Reward | Tier |
|----|------|--------|--------|------|
| fully_upgraded | Fully Upgraded | Max 1 vehicle | 1000 | Gold |
| all_vehicles | All Vehicles | Own all 6 | 2500 | Gold |
| all_stages | All Stages | Own all 6 | 2500 | Gold |
| daily_warrior | Daily Warrior | 7 dailies | 1000 | Silver |
| perfectionist | Perfectionist | All achievements | 10000 | Platinum |

##### Secret Category
| ID | Name | Trigger | Reward | Tier |
|----|------|---------|--------|------|
| night_owl | Night Owl | Play at 3AM | 500 | Silver |
| speed_demon | Speed Demon | 200+ km/h | 1000 | Gold |
| survivor | Survivor | 10min no crash | 750 | Silver |
| moonwalker | Moonwalker | Backflip on Moon | 1500 | Gold |

---

### Particle Effects System (`src/game/systems/particles.ts`)

#### Particle Types
- **Dust**: Brown particles on ground contact
- **Spark**: Yellow particles on hard impacts
- **Coin**: Gold particles on coin collection
- **Boost**: Orange particles during boost

#### Emitter Features
- Configurable spawn rate, lifetime, velocity
- Gravity and drag physics
- Color and size variation
- Fade out over lifetime

---

### Purchase Tracking System

#### PlayerProgress Structure
```typescript
type PlayerProgress = {
  coins: number;
  totalCoins: number;
  upgrades: UpgradeLevels;
  bestDistance: number;
  totalRuns: number;
  // Vehicle tracking
  unlockedVehicles: VehicleId[];
  selectedVehicle: VehicleId;
  vehicleUpgrades: Record<VehicleId, UpgradeLevels>;
  // Stage tracking
  unlockedStages: StageId[];
  selectedStage: StageId;
  // Stats tracking
  totalAirTime: number;
  totalTricks: number;
  highestCombo: number;
  stagesPlayed: StageId[];
};
```

#### Purchase Methods
- `purchaseVehicle(id)` - Buy vehicle if affordable
- `purchaseStage(id)` - Buy stage if affordable
- `selectVehicle(id)` - Switch active vehicle
- `selectStage(id)` - Switch active stage

#### Info Methods
- `getVehicleInfo(id)` - Get purchase status/cost
- `getStageInfo(id)` - Get purchase status/cost
- `getAllVehicleInfos()` - For shop UI
- `getAllStageInfos()` - For shop UI

---

### UI Components

#### TrickPopup (`src/components/TrickPopup.tsx`)
- Animated trick notifications
- Shows trick name and points
- Auto-dismisses after delay
- Stacks multiple tricks

#### Screens Created
- `HomeScreen.tsx` - Main menu
- `VehicleSelectScreen.tsx` - Garage/vehicle shop
- `StageSelectScreen.tsx` - Stage selection

---

### Audio System (`src/audio/AudioManager.ts`)

#### Sound Categories
- Engine sounds
- UI sounds
- Pickup sounds
- Ambient sounds

#### Features
- Volume controls per category
- Mute/unmute functionality
- Preloading for performance

---

### Legal Compliance

#### EULA (`src/components/EULAModal.tsx`)
- In-app EULA modal
- Must accept before playing
- Stored acceptance in AsyncStorage

#### Privacy & Data
- Delete My Data feature
- GDPR/CCPA compliant
- No external data collection

---

## Test Coverage

### Test Files Created
| File | Tests | Coverage |
|------|-------|----------|
| `tricks.test.ts` | Trick detection | Full |
| `combo.test.ts` | Combo system | Full |
| `boost.test.ts` | Boost system | Full |
| `achievements.test.ts` | Achievement system | Full |
| `upgrades.test.ts` | Progression/purchases | Full |
| `vehicles.test.ts` | Vehicle config | Full |
| `stages.test.ts` | Stage config | Full |
| `particles.test.ts` | Particle system | Full |

### Test Statistics
- **Total Test Suites**: 18
- **Total Tests**: 297
- **Pass Rate**: 100%

---

## File Structure

```
src/
├── audio/
│   ├── AudioManager.ts
│   └── __tests__/
├── components/
│   ├── EULAModal.tsx
│   ├── TrickPopup.tsx
│   └── ...
├── game/
│   ├── config/
│   │   ├── vehicles.ts
│   │   ├── stages.ts
│   │   ├── vehicleConfig.ts
│   │   └── __tests__/
│   ├── physics/
│   │   ├── world.ts
│   │   ├── vehicle.ts
│   │   └── __tests__/
│   ├── progression/
│   │   ├── upgrades.ts
│   │   └── __tests__/
│   ├── systems/
│   │   ├── tricks.ts
│   │   ├── combo.ts
│   │   ├── boost.ts
│   │   ├── achievements.ts
│   │   ├── dailyChallenge.ts
│   │   ├── ghost.ts
│   │   ├── particles.ts
│   │   └── __tests__/
│   └── terrain/
│       └── generator.ts
├── screens/
│   ├── HomeScreen.tsx
│   ├── VehicleSelectScreen.tsx
│   ├── StageSelectScreen.tsx
│   └── ...
└── ...
```

---

## Git Commit History (Recent)

| Commit | Description |
|--------|-------------|
| `5394657` | Add vehicle and stage purchase tracking with persistence |
| `7159a7d` | Add unique Summit Wheels features (differentiation from HCR) |
| `763692f` | Add Hill Climb Racing-style enhancements |
| `70ada0d` | Add Delete My Data feature for GDPR/CCPA/Apple compliance |
| `6e21c4b` | Add in-app EULA modal (Apple App Store compliant) |
| `3e018e6` | Add audio assets and legal documents |

---

## Unique Differentiators from Hill Climb Racing

1. **Combo System** - Chain tricks for multipliers (HCR has no combo)
2. **Skill-Based Boost** - Earned through tricks, not bought (HCR boost is fuel-like)
3. **Daily Challenges with Physics Modifiers** - Unique gameplay variations
4. **Ghost Racing** - Race your personal best
5. **Achievement System with Unlockable Content** - 23 achievements with rewards
6. **Stage-Specific Physics** - Moon has 0.16x gravity, Volcano has 1.2x

---

## Known Issues / TODO

### To Be Integrated
- [ ] Connect all systems to main GameScreen
- [ ] Implement HUD with combo/boost displays
- [ ] Add visual effects for boost activation
- [ ] Implement ghost rendering during gameplay
- [ ] Connect daily challenges to game loop

### Future Enhancements
- [ ] Leaderboards (online)
- [ ] Multiplayer ghost races
- [ ] More vehicles and stages
- [ ] Seasonal events
- [ ] Social features

---

## Performance Considerations

- Matter.js physics runs at 60 FPS
- Particle system limits active particles
- Terrain chunks loaded/unloaded dynamically
- AsyncStorage writes are debounced
- Ghost data is compressed for storage

---

## Build & Deployment

### Development
```bash
npm start          # Start Expo dev server
npm test           # Run all tests
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
```

### Production
```bash
eas build --platform ios      # Build for iOS
eas build --platform android  # Build for Android
eas submit --platform ios     # Submit to App Store
eas submit --platform android # Submit to Play Store
```

---

## V2 Considerations (Unity Migration)

See `docs/UNITY_V2_MASTER_PROMPT.md` for:
- Complete game design document
- Unity implementation guidelines
- Migration checklist
- C# code structure recommendations

Reasons to consider Unity for V2:
- Better physics performance
- More advanced visual effects
- Larger game dev ecosystem
- Better tooling for 2D games
- Industry standard for mobile games

---

*Last Updated: January 2026*
*Total Development Sessions: Multiple*
*Test Coverage: 297 tests, 100% pass rate*
