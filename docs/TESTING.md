# Testing Guide - Summit Wheels

## One-Command Test Execution

```bash
npm test
```

This runs all 107 unit tests via Jest.

## Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | TypeScript type checking |

## Test Structure

```
summit-wheels/
├── __tests__/
│   └── sanity.test.ts          # 5 tests - Basic project setup
├── src/
│   ├── audio/
│   │   └── __tests__/
│   │       └── AudioManager.test.ts  # 24 tests - Audio system + AudioToggleTest
│   ├── game/
│   │   ├── __tests__/
│   │   │   ├── fuel.test.ts          # 14 tests - Fuel system
│   │   │   ├── pickups.test.ts       # 16 tests - Pickup spawning
│   │   │   ├── physics.smoke.test.ts # 6 tests - Physics smoke
│   │   │   ├── seededRng.test.ts     # 10 tests - RNG
│   │   │   └── terrain.test.ts       # 7 tests - Terrain
│   │   └── progression/
│   │       └── __tests__/
│   │           └── upgrades.test.ts  # 11 tests - Upgrades
│   ├── i18n/
│   │   └── __tests__/
│   │       └── i18n.test.ts          # 14 tests - Translations
│   └── hooks/
│       └── __tests__/
│           └── useEulaAcceptance.test.ts  # 5 tests - EULA
```

**Total: 112 tests across 10 test suites**

## Golden Path Smoke Test

The physics smoke test (`physics.smoke.test.ts`) verifies the core gameplay loop:

```typescript
it('should create world, step 60 frames, car exists and advances with gas', () => {
  // 1. Create physics world
  // 2. Spawn car at starting position
  // 3. Add ground
  // 4. Apply gas for 60 frames
  // 5. Verify car moved forward
});
```

This test ensures:
- Physics world initializes correctly
- Car spawns with body + 2 wheels
- Ground collision works
- Gas input moves car forward
- Braking reduces velocity

## Test Categories

### Unit Tests
- **Seeded RNG**: Deterministic random sequences
- **Terrain**: Procedural generation consistency
- **Fuel**: Consumption rates and refill
- **Pickups**: Spawn rates and collision
- **Upgrades**: Cost curves and stat bonuses
- **Audio**: Settings persistence

### Integration Tests
- **Physics Smoke**: Full physics loop
- **Pickup Collision**: Coin collection in world
- **i18n Validation**: EN/ES key completeness

## Running Specific Tests

```bash
# Run only physics tests
npm test -- --testPathPattern=physics

# Run only game tests
npm test -- --testPathPattern=game

# Run tests matching name
npm test -- -t "fuel"
```

## Coverage

Generate coverage report:

```bash
npm test -- --coverage
```

## Writing New Tests

### Unit Test Example

```typescript
import { createFuelSystem } from '../systems/fuel';

describe('FuelSystem', () => {
  it('should consume fuel when throttling', () => {
    const fuel = createFuelSystem();
    const initial = fuel.getState().current;

    fuel.consume(1, true, false); // 1 second, throttling

    expect(fuel.getState().current).toBeLessThan(initial);
  });
});
```

### Mock AsyncStorage

```typescript
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));
```

## CI/CD Integration

Tests run automatically. GREEN gate requires ALL tests to pass.

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test -- --ci --coverage
```
