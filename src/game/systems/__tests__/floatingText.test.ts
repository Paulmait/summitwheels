/**
 * Tests for Floating Text System
 */

import { createFloatingTextSystem, FloatingTextSystem } from '../floatingText';

describe('FloatingTextSystem', () => {
  let system: FloatingTextSystem;

  beforeEach(() => {
    system = createFloatingTextSystem();
  });

  describe('add', () => {
    it('should add floating text', () => {
      system.add('+1', 100, 200);

      const texts = system.getTexts();
      expect(texts).toHaveLength(1);
      expect(texts[0].text).toBe('+1');
      expect(texts[0].x).toBe(100);
      expect(texts[0].y).toBe(200);
    });

    it('should use default options', () => {
      system.add('Test', 0, 0);

      const texts = system.getTexts();
      expect(texts[0].color).toBe('#FFD700');
      expect(texts[0].fontSize).toBe(24);
      expect(texts[0].alpha).toBe(1);
    });

    it('should allow custom options', () => {
      system.add('Test', 0, 0, { color: '#FF0000', fontSize: 32 });

      const texts = system.getTexts();
      expect(texts[0].color).toBe('#FF0000');
      expect(texts[0].fontSize).toBe(32);
    });
  });

  describe('addCoinPickup', () => {
    it('should add coin pickup text with gold color', () => {
      system.addCoinPickup(5, 100, 200);

      const texts = system.getTexts();
      expect(texts[0].text).toBe('+5');
      expect(texts[0].color).toBe('#FFD700');
    });
  });

  describe('addCombo', () => {
    it('should add combo text', () => {
      system.addCombo(3, 100, 200);

      const texts = system.getTexts();
      expect(texts[0].text).toBe('3x COMBO!');
    });
  });

  describe('addTrick', () => {
    it('should add trick text with points', () => {
      system.addTrick('Backflip', 100, 100, 200);

      const texts = system.getTexts();
      expect(texts[0].text).toBe('Backflip +100');
    });
  });

  describe('update', () => {
    it('should move texts upward over time', () => {
      system.add('Test', 100, 200, { velocityY: -100 });
      const initialY = system.getTexts()[0].y;

      system.update(500); // 500ms = 0.5s at -100px/s = -50px

      const newY = system.getTexts()[0].y;
      expect(newY).toBeLessThan(initialY);
      expect(newY).toBeCloseTo(150, 0); // 200 - 50 = 150
    });

    it('should increase lifetime', () => {
      system.add('Test', 0, 0, { lifetime: 1000 });

      system.update(300);

      expect(system.getTexts()[0].lifetime).toBe(300);
    });

    it('should fade alpha in last 30% of lifetime', () => {
      system.add('Test', 0, 0, { lifetime: 1000 });

      // Before fade starts (70%)
      system.update(600);
      expect(system.getTexts()[0].alpha).toBe(1);

      // After fade starts
      system.update(200); // Now at 800ms
      expect(system.getTexts()[0].alpha).toBeLessThan(1);
    });

    it('should remove expired texts', () => {
      system.add('Test', 0, 0, { lifetime: 500 });

      system.update(600);

      expect(system.getTexts()).toHaveLength(0);
    });
  });

  describe('getTexts', () => {
    it('should return a copy of texts array', () => {
      system.add('Test', 0, 0);

      const texts1 = system.getTexts();
      const texts2 = system.getTexts();

      expect(texts1).not.toBe(texts2);
      expect(texts1).toEqual(texts2);
    });
  });

  describe('clear', () => {
    it('should remove all texts', () => {
      system.add('Test1', 0, 0);
      system.add('Test2', 0, 0);
      system.add('Test3', 0, 0);

      expect(system.getTexts()).toHaveLength(3);

      system.clear();

      expect(system.getTexts()).toHaveLength(0);
    });
  });
});
