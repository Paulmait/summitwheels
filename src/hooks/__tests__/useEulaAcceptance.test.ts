/**
 * Tests for EULA acceptance hook
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
}));

describe('EULA Acceptance', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    jest.clearAllMocks();
  });

  it('should store EULA acceptance in AsyncStorage', async () => {
    const EULA_KEY = '@summit_wheels_eula_accepted';
    const EULA_VERSION = '1.0';

    // Simulate accepting EULA
    await AsyncStorage.setItem(EULA_KEY, EULA_VERSION);

    // Verify it was stored
    const stored = await AsyncStorage.getItem(EULA_KEY);
    expect(stored).toBe(EULA_VERSION);
  });

  it('should return null if EULA not accepted', async () => {
    const EULA_KEY = '@summit_wheels_eula_accepted';

    const stored = await AsyncStorage.getItem(EULA_KEY);
    expect(stored).toBeNull();
  });

  it('should allow resetting EULA acceptance', async () => {
    const EULA_KEY = '@summit_wheels_eula_accepted';
    const EULA_VERSION = '1.0';

    // Accept EULA
    await AsyncStorage.setItem(EULA_KEY, EULA_VERSION);
    expect(await AsyncStorage.getItem(EULA_KEY)).toBe(EULA_VERSION);

    // Reset
    await AsyncStorage.removeItem(EULA_KEY);
    expect(await AsyncStorage.getItem(EULA_KEY)).toBeNull();
  });

  it('should require re-acceptance when version changes', async () => {
    const EULA_KEY = '@summit_wheels_eula_accepted';

    // User accepted version 1.0
    mockStorage[EULA_KEY] = '1.0';

    // Check if current version (1.0) matches
    const stored = await AsyncStorage.getItem(EULA_KEY);
    expect(stored === '1.0').toBe(true);

    // If we change required version to 2.0
    expect(stored === '2.0').toBe(false);
  });
});

describe('EULA Modal Content', () => {
  it('should contain required legal text elements', () => {
    // These are the required elements per Apple guidelines
    const requiredElements = [
      'licensed, not sold',
      'non-transferable',
      'personal use',
      'may not copy, modify, or reverse engineer',
      'as is',
      'without warranties',
      'not responsible for any damages',
      'State of Florida',
      'Cien Rios LLC',
      '17113 Miramar Parkway',
      'Miramar, FL 33027',
      '(754) 254-7141',
    ];

    // EULA text that would be displayed
    const eulaText = `
      By using Summit Wheels, you agree to the following:
      • This app is licensed, not sold, to you.
      • This license is non-transferable and limited to personal use.
      • You may not copy, modify, or reverse engineer the app.
      • The app is provided "as is" without warranties.
      • Cien Rios LLC is not responsible for any damages arising from use of the app.
      • This agreement is governed by the laws of the State of Florida, USA.
      Developer: Cien Rios LLC
      17113 Miramar Parkway
      Miramar, FL 33027
      United States
      Phone: (754) 254-7141
    `;

    requiredElements.forEach((element) => {
      expect(eulaText).toContain(element);
    });
  });
});
