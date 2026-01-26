# Summit Wheels V2 - Unity Migration Master Prompt

## Project Overview

You are helping migrate Summit Wheels from React Native/Expo to Unity for version 2.0. Summit Wheels is a 2D side-scrolling hill climb racing game similar to Hill Climb Racing but with unique differentiating features.

## Current Tech Stack (V1 - Reference Only)
- React Native with Expo SDK 54
- Matter.js for 2D physics
- TypeScript
- AsyncStorage for persistence
- EAS Build for iOS/Android deployment

## Target Tech Stack (V2)
- Unity 2022 LTS or newer
- Unity 2D Physics (Box2D-based)
- C# scripting
- Unity PlayerPrefs or custom save system for persistence
- Unity Cloud Build or local builds for iOS/Android

---

## Game Design Document

### Core Gameplay
- 2D side-scrolling hill climb racing
- Physics-based vehicle movement with realistic suspension
- Procedurally generated or hand-crafted terrain
- Fuel management mechanic
- Distance-based progression
- Coin collection for upgrades

### Unique Features (Differentiators from Hill Climb Racing)

#### 1. Combo System
Chain tricks together for score multipliers:
- Multiplier increases with each consecutive trick (1.0x to 5.0x max)
- Multiplier increment: 0.2x per trick
- Combo window: 3 seconds between tricks
- Tier progression with bonuses:
  - Nice (5 tricks): +100 coins
  - Great (10 tricks): +500 coins
  - Awesome (15 tricks): +2000 coins
  - Legendary (20 tricks): +10000 coins

#### 2. Skill-Based Boost System
Boost earned through tricks, not purchased:
- Max boost: 100 units
- Gain rate: 0.2 boost per trick point
- Consumption: 30 units/second while active
- Power multiplier: 1.8x engine power when boosting
- Passive regeneration: 2 units/second when not boosting
- Minimum to activate: 20 units
- Cooldown after use: 1 second

#### 3. Daily Challenge System
Unique daily modifiers that change gameplay:
```
Modifiers:
- low_gravity: 0.5x gravity
- high_gravity: 1.5x gravity
- slippery: 0.5x friction
- sticky: 1.5x friction
- double_coins: 2x coin value
- half_fuel: 0.5x fuel capacity
- no_brakes: Brakes disabled
- super_boost: 2x boost power
- giant_wheels: 1.5x wheel size
- tiny_vehicle: 0.7x vehicle scale
- reverse_controls: Inverted controls
- fog: Limited visibility

Goal Types:
- distance: Reach X meters
- coins: Collect X coins
- tricks: Perform X tricks
- airtime: Accumulate X seconds airtime
- no_crash: Complete without crashing
```

#### 4. Ghost Racing System
Race against your personal best:
- Record player position, rotation, velocity at 10 FPS
- Playback ghost as semi-transparent vehicle
- Show time delta (+/- seconds) during race
- Compression for efficient storage

#### 5. Achievement System
23 achievements across 5 categories:
- Distance (first_steps, going_places, marathon, explorer, legend)
- Tricks (first_flip, flip_master, air_time, combo_starter, combo_king)
- Collection (coin_collector, treasure_hunter, wealthy, tycoon)
- Mastery (fully_upgraded, all_vehicles, all_stages, daily_warrior, perfectionist)
- Secret (hidden achievements unlocked through special actions)

Tiers: Bronze, Silver, Gold, Platinum
Each achievement rewards coins and some unlock vehicles/content.

---

## Vehicles

### Vehicle Data Structure
```csharp
public class VehicleData {
    public string id;
    public string name;
    public string description;
    public int unlockCost;
    public VehicleStats baseStats;
    public int starRating; // 1-5
}

public class VehicleStats {
    public float enginePower;
    public float wheelFriction;
    public float suspensionStiffness;
    public float suspensionDamping;
    public float fuelCapacity;
    public float fuelConsumption;
    public float mass;
    public float wheelRadius;
}
```

### Vehicle Roster
| ID | Name | Cost | Stars | Description |
|----|------|------|-------|-------------|
| jeep | Jeep | 0 (Free) | 2 | Reliable starter vehicle |
| monster_truck | Monster Truck | 5,000 | 3 | Big wheels, great traction |
| dune_buggy | Dune Buggy | 10,000 | 3 | Lightweight and fast |
| tank | Tank | 25,000 | 4 | Heavy and powerful |
| super_car | Super Car | 50,000 | 4 | Speed demon |
| moon_rover | Moon Rover | 75,000 | 5 | Ultimate off-road machine |

### Vehicle Stats (Base Values)
```
Jeep:
  enginePower: 800, wheelFriction: 0.8, fuelCapacity: 100
  suspensionStiffness: 0.3, suspensionDamping: 0.2

Monster Truck:
  enginePower: 1200, wheelFriction: 1.0, fuelCapacity: 120
  suspensionStiffness: 0.25, suspensionDamping: 0.15

Dune Buggy:
  enginePower: 600, wheelFriction: 0.6, fuelCapacity: 80
  suspensionStiffness: 0.4, suspensionDamping: 0.3

Tank:
  enginePower: 2000, wheelFriction: 1.2, fuelCapacity: 200
  suspensionStiffness: 0.5, suspensionDamping: 0.4

Super Car:
  enginePower: 1500, wheelFriction: 0.9, fuelCapacity: 90
  suspensionStiffness: 0.35, suspensionDamping: 0.25

Moon Rover:
  enginePower: 1000, wheelFriction: 1.1, fuelCapacity: 150
  suspensionStiffness: 0.2, suspensionDamping: 0.1
```

---

## Stages/Environments

### Stage Data Structure
```csharp
public class StageData {
    public string id;
    public string name;
    public string description;
    public int unlockCost;
    public StagePhysics physics;
    public StageVisuals visuals;
    public float coinMultiplier;
    public float fuelPickupMultiplier;
}

public class StagePhysics {
    public float gravity; // Multiplier (1.0 = Earth)
    public float friction;
    public float terrainRoughness;
}
```

### Stage Roster
| ID | Name | Cost | Gravity | Description |
|----|------|------|---------|-------------|
| countryside | Countryside | 0 (Free) | 1.0x | Rolling green hills |
| desert | Desert | 2,500 | 1.0x | Sandy dunes, low friction |
| arctic | Arctic | 7,500 | 1.0x | Icy and slippery |
| forest | Forest | 15,000 | 1.0x | Dense woodland terrain |
| moon | Moon | 20,000 | 0.16x | Low gravity lunar surface |
| volcano | Volcano | 40,000 | 1.2x | Dangerous volcanic terrain |

---

## Upgrade System

### Upgrade Types
| Type | Base Cost | Effect per Level | Max Level |
|------|-----------|------------------|-----------|
| Engine | 50 | +50 power | 10 |
| Tires | 40 | +0.05 friction | 10 |
| Suspension | 45 | +0.02 stiffness | 10 |
| Fuel Tank | 35 | +10 capacity | 10 |

### Cost Formula
```
cost = baseCost * (1.5 ^ currentLevel)
```

### Per-Vehicle Upgrades
Each vehicle maintains its own upgrade levels. Switching vehicles loads that vehicle's upgrades.

---

## Tricks System

### Trick Detection
```csharp
public enum TrickType {
    Frontflip,    // 360° forward rotation
    Backflip,     // 360° backward rotation
    DoubleFlip,   // 720° rotation (any direction)
    BigAir,       // 2+ seconds airtime
    PerfectLanding // Land within 15° of level
}
```

### Trick Points
| Trick | Base Points |
|-------|-------------|
| Frontflip | 100 |
| Backflip | 100 |
| Double Flip | 300 |
| Big Air | 50 per second |
| Perfect Landing | 50 bonus |

---

## Unity Implementation Guidelines

### Project Structure
```
Assets/
├── Scripts/
│   ├── Core/
│   │   ├── GameManager.cs
│   │   ├── InputManager.cs
│   │   └── SaveManager.cs
│   ├── Vehicle/
│   │   ├── VehicleController.cs
│   │   ├── VehicleStats.cs
│   │   └── WheelController.cs
│   ├── Terrain/
│   │   ├── TerrainGenerator.cs
│   │   └── TerrainChunk.cs
│   ├── Systems/
│   │   ├── TrickSystem.cs
│   │   ├── ComboSystem.cs
│   │   ├── BoostSystem.cs
│   │   ├── FuelSystem.cs
│   │   ├── CoinSystem.cs
│   │   ├── AchievementSystem.cs
│   │   ├── DailyChallengeSystem.cs
│   │   └── GhostSystem.cs
│   ├── UI/
│   │   ├── HUDController.cs
│   │   ├── ShopUI.cs
│   │   ├── GarageUI.cs
│   │   └── ResultsUI.cs
│   └── Data/
│       ├── VehicleDatabase.cs
│       ├── StageDatabase.cs
│       └── AchievementDatabase.cs
├── Prefabs/
│   ├── Vehicles/
│   ├── Pickups/
│   ├── Effects/
│   └── UI/
├── Scenes/
│   ├── MainMenu.unity
│   ├── Garage.unity
│   ├── StageSelect.unity
│   └── Game.unity
├── ScriptableObjects/
│   ├── Vehicles/
│   ├── Stages/
│   └── Achievements/
└── Art/
    ├── Sprites/
    ├── Animations/
    └── UI/
```

### Key Unity Components

#### Vehicle Controller
```csharp
// Use WheelJoint2D for realistic suspension
// Rigidbody2D for physics
// Apply torque for engine power, not direct velocity
```

#### Terrain Generation
```csharp
// Use EdgeCollider2D or PolygonCollider2D
// Procedural mesh generation for visual terrain
// Chunk-based loading for infinite terrain
```

#### Physics Settings
```csharp
// Project Settings > Physics 2D
// Gravity: -9.81 (adjustable per stage)
// Default Material: friction 0.4, bounciness 0.1
// Fixed Timestep: 0.02 (50 FPS physics)
```

### Save System
```csharp
[System.Serializable]
public class PlayerProgress {
    public int coins;
    public int totalCoins;
    public float bestDistance;
    public int totalRuns;
    public List<string> unlockedVehicles;
    public string selectedVehicle;
    public Dictionary<string, UpgradeLevels> vehicleUpgrades;
    public List<string> unlockedStages;
    public string selectedStage;
    public float totalAirTime;
    public int totalTricks;
    public int highestCombo;
    public List<string> stagesPlayed;
    public Dictionary<string, AchievementProgress> achievements;
}
```

---

## Migration Checklist

### Phase 1: Core Setup
- [ ] Create Unity 2D project
- [ ] Set up project structure
- [ ] Configure physics settings
- [ ] Create basic vehicle prefab with WheelJoint2D
- [ ] Implement basic terrain generation
- [ ] Add touch/keyboard input handling

### Phase 2: Vehicle System
- [ ] Create VehicleData ScriptableObjects
- [ ] Implement VehicleController with physics
- [ ] Add fuel system
- [ ] Implement all 6 vehicles
- [ ] Create vehicle selection UI

### Phase 3: Stage System
- [ ] Create StageData ScriptableObjects
- [ ] Implement terrain themes
- [ ] Add stage-specific physics modifiers
- [ ] Implement all 6 stages
- [ ] Create stage selection UI

### Phase 4: Progression Systems
- [ ] Implement save/load system
- [ ] Add coin collection
- [ ] Create upgrade system
- [ ] Implement shop UI
- [ ] Add purchase tracking

### Phase 5: Unique Features
- [ ] Implement trick detection
- [ ] Add combo system
- [ ] Create boost system
- [ ] Implement daily challenges
- [ ] Add ghost racing
- [ ] Create achievement system

### Phase 6: Polish
- [ ] Add particle effects
- [ ] Implement audio system
- [ ] Create animations
- [ ] Add haptic feedback
- [ ] Optimize performance

### Phase 7: Platform Integration
- [ ] iOS build configuration
- [ ] Android build configuration
- [ ] In-app purchases (if needed)
- [ ] Analytics integration
- [ ] Crash reporting

---

## V1 Reference Files

When migrating, reference these V1 files for logic:

| V1 File | Purpose |
|---------|---------|
| `src/game/systems/tricks.ts` | Trick detection logic |
| `src/game/systems/combo.ts` | Combo multiplier system |
| `src/game/systems/boost.ts` | Boost mechanics |
| `src/game/systems/dailyChallenge.ts` | Daily challenge generation |
| `src/game/systems/ghost.ts` | Ghost recording/playback |
| `src/game/systems/achievements.ts` | Achievement definitions |
| `src/game/config/vehicles.ts` | Vehicle stats and data |
| `src/game/config/stages.ts` | Stage configs |
| `src/game/progression/upgrades.ts` | Save system and purchases |

---

## Performance Targets

- 60 FPS on iPhone 8 and newer
- 60 FPS on Android devices with Snapdragon 660+
- Load time under 3 seconds
- Memory usage under 200MB
- Battery-efficient (no excessive GPU usage)

---

## Art Style Guidelines

- Colorful, cartoon-style graphics
- Clean, readable UI
- Smooth animations
- Distinct visual identity per stage
- Vehicle designs that are unique but recognizable

---

## Audio Requirements

- Engine sounds (pitch varies with RPM)
- Suspension/landing sounds
- Coin pickup sounds
- Trick completion sounds
- Combo tier-up sounds
- Boost activation/deactivation sounds
- Background music per stage
- UI interaction sounds

---

## Testing Requirements

- Unit tests for all game systems
- Integration tests for save/load
- Performance profiling
- Device testing matrix
- Playtest for game feel and balance

---

## Notes for Claude Code Agent

1. Start with core vehicle physics - this is the foundation
2. Get the "game feel" right before adding features
3. Use ScriptableObjects for all configuration data
4. Keep systems decoupled and testable
5. Reference V1 TypeScript code for business logic
6. Prioritize performance from the start
7. Test on real devices early and often
