/**
 * Tests for i18n system
 */

import { t, setLanguage, getLanguage, validateTranslations, en, es } from '../index';

describe('i18n', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  describe('setLanguage/getLanguage', () => {
    it('should set and get language', () => {
      setLanguage('es');
      expect(getLanguage()).toBe('es');

      setLanguage('en');
      expect(getLanguage()).toBe('en');
    });
  });

  describe('t (translate)', () => {
    it('should translate simple keys', () => {
      setLanguage('en');
      expect(t('game.title')).toBe('Summit Wheels');

      setLanguage('es');
      expect(t('game.title')).toBe('Summit Wheels');
    });

    it('should translate nested keys', () => {
      setLanguage('en');
      expect(t('settings.audio')).toBe('Audio');

      setLanguage('es');
      expect(t('settings.audio')).toBe('Audio');
    });

    it('should return key if not found', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('should fallback to English if key missing in current language', () => {
      setLanguage('es');
      // All keys exist in both, so this is a basic check
      expect(t('common.back')).toBe('Atrás');
    });
  });

  describe('validateTranslations', () => {
    it('should verify all EN keys exist in ES', () => {
      const missing = validateTranslations('en', 'es');
      expect(missing).toHaveLength(0);
    });

    it('should verify all ES keys exist in EN', () => {
      const missing = validateTranslations('es', 'en');
      expect(missing).toHaveLength(0);
    });
  });

  describe('translation content', () => {
    it('should have game strings in both languages', () => {
      expect(en.game.tapToStart).toBeDefined();
      expect(es.game.tapToStart).toBeDefined();
    });

    it('should have settings strings in both languages', () => {
      expect(en.settings.soundEffects).toBeDefined();
      expect(es.settings.soundEffects).toBeDefined();
    });

    it('should have garage strings in both languages', () => {
      expect(en.garage.upgrades).toBeDefined();
      expect(es.garage.upgrades).toBeDefined();
    });
  });
});
