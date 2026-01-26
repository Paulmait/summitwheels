/**
 * Sound Assets - Static require() imports for audio files
 *
 * React Native/Expo requires static paths for require(),
 * so we can't dynamically construct paths at runtime.
 */

import { SfxKey, MusicKey, SFX_KEYS, MUSIC_KEYS } from './audioKeys';

// SFX asset map - static requires
export const SFX_ASSETS: Record<SfxKey, ReturnType<typeof require> | null> = {
  [SFX_KEYS.COIN_PICKUP]: require('../../assets/audio/sfx/coin.wav'),
  [SFX_KEYS.FUEL_PICKUP]: require('../../assets/audio/sfx/powerup.wav'),
  [SFX_KEYS.CRASH]: require('../../assets/audio/sfx/crash.wav'),
  [SFX_KEYS.FLIP]: require('../../assets/audio/sfx/whoosh.wav'),
  [SFX_KEYS.ENGINE_START]: require('../../assets/audio/sfx/engine_start.wav'),
  [SFX_KEYS.ENGINE_LOOP]: require('../../assets/audio/sfx/engine_loop.wav'),
  [SFX_KEYS.BRAKE]: require('../../assets/audio/sfx/brake.wav'),
  [SFX_KEYS.LANDING]: require('../../assets/audio/sfx/landing.wav'),
  [SFX_KEYS.UI_CLICK]: require('../../assets/audio/sfx/click.wav'),
  [SFX_KEYS.BUTTON_TAP]: require('../../assets/audio/sfx/switch.wav'),
  [SFX_KEYS.UPGRADE]: require('../../assets/audio/sfx/confirm.wav'),
  [SFX_KEYS.NEW_BEST]: require('../../assets/audio/sfx/jingle.wav'),
};

// Music asset map - static requires
export const MUSIC_ASSETS: Record<MusicKey, ReturnType<typeof require> | null> = {
  [MUSIC_KEYS.MENU_THEME]: require('../../assets/audio/music/menu_theme.wav'),
  [MUSIC_KEYS.GAMEPLAY_LOOP]: require('../../assets/audio/music/gameplay_loop.wav'),
};

/**
 * Get SFX asset source
 */
export function getSfxAsset(key: SfxKey): ReturnType<typeof require> | null {
  return SFX_ASSETS[key] || null;
}

/**
 * Get music asset source
 */
export function getMusicAsset(key: MusicKey): ReturnType<typeof require> | null {
  return MUSIC_ASSETS[key] || null;
}
