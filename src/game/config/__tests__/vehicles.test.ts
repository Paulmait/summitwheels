/**
 * Tests for Vehicle Configuration
 */

import {
  VEHICLES,
  VehicleId,
  getVehicle,
  getAllVehicles,
  getStarterVehicle,
  isVehicleUnlocked,
  getLockedVehicles,
} from '../vehicles';

describe('Vehicle Configuration', () => {
  describe('VEHICLES constant', () => {
    it('should have all expected vehicles', () => {
      const vehicleIds: VehicleId[] = [
        'jeep',
        'monster_truck',
        'dune_buggy',
        'tank',
        'super_car',
        'moon_rover',
      ];

      vehicleIds.forEach((id) => {
        expect(VEHICLES[id]).toBeDefined();
      });
    });

    it('should have jeep as free starter vehicle', () => {
      expect(VEHICLES.jeep.unlockCost).toBe(0);
    });

    it('should have all required stats for each vehicle', () => {
      Object.values(VEHICLES).forEach((vehicle) => {
        expect(vehicle.stats.enginePower).toBeGreaterThan(0);
        expect(vehicle.stats.maxWheelSpeed).toBeGreaterThan(0);
        expect(vehicle.stats.wheelFriction).toBeGreaterThan(0);
        expect(vehicle.stats.fuelCapacity).toBeGreaterThan(0);
      });
    });

    it('should have visual properties for each vehicle', () => {
      Object.values(VEHICLES).forEach((vehicle) => {
        expect(vehicle.visual.bodyWidth).toBeGreaterThan(0);
        expect(vehicle.visual.bodyHeight).toBeGreaterThan(0);
        expect(vehicle.visual.wheelRadius).toBeGreaterThan(0);
        expect(vehicle.visual.bodyColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should have star ratings between 1-5', () => {
      Object.values(VEHICLES).forEach((vehicle) => {
        expect(vehicle.starRating.speed).toBeGreaterThanOrEqual(1);
        expect(vehicle.starRating.speed).toBeLessThanOrEqual(5);
        expect(vehicle.starRating.grip).toBeGreaterThanOrEqual(1);
        expect(vehicle.starRating.grip).toBeLessThanOrEqual(5);
        expect(vehicle.starRating.fuel).toBeGreaterThanOrEqual(1);
        expect(vehicle.starRating.fuel).toBeLessThanOrEqual(5);
        expect(vehicle.starRating.stability).toBeGreaterThanOrEqual(1);
        expect(vehicle.starRating.stability).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('getVehicle', () => {
    it('should return correct vehicle by ID', () => {
      const jeep = getVehicle('jeep');
      expect(jeep.name).toBe('Jeep');

      const tank = getVehicle('tank');
      expect(tank.name).toBe('Tank');
    });
  });

  describe('getAllVehicles', () => {
    it('should return all vehicles sorted by unlock cost', () => {
      const vehicles = getAllVehicles();

      expect(vehicles.length).toBe(6);
      expect(vehicles[0].id).toBe('jeep'); // Free vehicle first

      // Verify sorted by unlock cost
      for (let i = 1; i < vehicles.length; i++) {
        expect(vehicles[i].unlockCost).toBeGreaterThanOrEqual(
          vehicles[i - 1].unlockCost
        );
      }
    });
  });

  describe('getStarterVehicle', () => {
    it('should return jeep as starter vehicle', () => {
      const starter = getStarterVehicle();
      expect(starter.id).toBe('jeep');
      expect(starter.unlockCost).toBe(0);
    });
  });

  describe('isVehicleUnlocked', () => {
    it('should return true for free vehicles', () => {
      expect(isVehicleUnlocked('jeep', [])).toBe(true);
    });

    it('should return true for purchased vehicles', () => {
      expect(isVehicleUnlocked('tank', ['tank'])).toBe(true);
    });

    it('should return false for locked vehicles', () => {
      expect(isVehicleUnlocked('tank', [])).toBe(false);
      expect(isVehicleUnlocked('monster_truck', ['jeep'])).toBe(false);
    });
  });

  describe('getLockedVehicles', () => {
    it('should return all non-free vehicles when none unlocked', () => {
      const locked = getLockedVehicles([]);

      expect(locked.every((v) => v.unlockCost > 0)).toBe(true);
      expect(locked.length).toBe(5); // All except jeep
    });

    it('should exclude unlocked vehicles', () => {
      const locked = getLockedVehicles(['tank', 'dune_buggy']);

      expect(locked.find((v) => v.id === 'tank')).toBeUndefined();
      expect(locked.find((v) => v.id === 'dune_buggy')).toBeUndefined();
    });
  });

  describe('Vehicle balance', () => {
    it('should have different trade-offs per vehicle', () => {
      const jeep = getVehicle('jeep');
      const duneBuggy = getVehicle('dune_buggy');
      const tank = getVehicle('tank');

      // Dune buggy should be faster than jeep
      expect(duneBuggy.stats.maxWheelSpeed).toBeGreaterThan(
        jeep.stats.maxWheelSpeed
      );

      // Tank should have more stability but less speed
      expect(tank.stats.suspensionStiffness).toBeGreaterThan(
        duneBuggy.stats.suspensionStiffness
      );
      expect(tank.stats.maxWheelSpeed).toBeLessThan(
        duneBuggy.stats.maxWheelSpeed
      );
    });

    it('should have appropriate unlock costs', () => {
      const vehicles = getAllVehicles();

      // More powerful vehicles should cost more
      vehicles.forEach((vehicle) => {
        if (vehicle.unlockCost === 0) return;

        // Higher cost vehicles should generally have better max stats
        const totalStats =
          vehicle.starRating.speed +
          vehicle.starRating.grip +
          vehicle.starRating.fuel +
          vehicle.starRating.stability;

        expect(totalStats).toBeGreaterThanOrEqual(8); // Some minimum competitiveness
      });
    });
  });
});
