/**
 * Audio Keys - Identifiers for all sound effects and music
 */

export const SFX_KEYS = {
  COIN_PICKUP: 'coin_pickup',
  FUEL_PICKUP: 'fuel_pickup',
  CRASH: 'crash',
  UI_CLICK: 'ui_click',
  ENGINE_START: 'engine_start',
  ENGINE_LOOP: 'engine_loop',
  BRAKE: 'brake',
  LANDING: 'landing',
  NEW_BEST: 'new_best',
} as const;

export type SfxKey = (typeof SFX_KEYS)[keyof typeof SFX_KEYS];

export const MUSIC_KEYS = {
  MENU_THEME: 'menu_theme',
  GAMEPLAY_LOOP: 'gameplay_loop',
} as const;

export type MusicKey = (typeof MUSIC_KEYS)[keyof typeof MUSIC_KEYS];

/**
 * Sound file paths (relative to assets/audio)
 * These will be used when loading sounds
 */
export const SOUND_PATHS: Record<SfxKey | MusicKey, string | null> = {
  // SFX - will be replaced with actual paths when assets are added
  [SFX_KEYS.COIN_PICKUP]: null, // 'coin.mp3'
  [SFX_KEYS.FUEL_PICKUP]: null, // 'fuel.mp3'
  [SFX_KEYS.CRASH]: null, // 'crash.mp3'
  [SFX_KEYS.UI_CLICK]: null, // 'click.mp3'
  [SFX_KEYS.ENGINE_START]: null, // 'engine_start.mp3'
  [SFX_KEYS.ENGINE_LOOP]: null, // 'engine_loop.mp3'
  [SFX_KEYS.BRAKE]: null, // 'brake.mp3'
  [SFX_KEYS.LANDING]: null, // 'landing.mp3'
  [SFX_KEYS.NEW_BEST]: null, // 'new_best.mp3'

  // Music
  [MUSIC_KEYS.MENU_THEME]: null, // 'menu_theme.mp3'
  [MUSIC_KEYS.GAMEPLAY_LOOP]: null, // 'gameplay_loop.mp3'
};
