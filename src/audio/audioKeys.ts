/**
 * Audio Keys - Identifiers for all sound effects and music
 * Using royalty-free sounds from Kenney.nl and OpenGameArt (CC0)
 */

export const SFX_KEYS = {
  // Pickups
  COIN_PICKUP: 'coin_pickup',
  FUEL_PICKUP: 'fuel_pickup',

  // Vehicle
  CRASH: 'crash',
  FLIP: 'flip',
  ENGINE_START: 'engine_start',
  ENGINE_LOOP: 'engine_loop',
  BRAKE: 'brake',
  LANDING: 'landing',

  // UI
  UI_CLICK: 'ui_click',
  BUTTON_TAP: 'button_tap',
  UPGRADE: 'upgrade',
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
 * Source: Kenney.nl Game Audio (CC0) and OpenGameArt (CC0)
 *
 * Placeholder paths - will be updated when audio files are added:
 * - coin_pickup: kenney_impact/coin.ogg
 * - fuel_pickup: kenney_impact/powerup.ogg
 * - crash: kenney_impact/crash.ogg
 * - flip: kenney_impact/whoosh.ogg
 * - ui_click: kenney_ui/click.ogg
 * - button_tap: kenney_ui/switch.ogg
 * - upgrade: kenney_ui/confirm.ogg
 * - new_best: kenney_ui/jingle.ogg
 */
export const SOUND_PATHS: Record<SfxKey | MusicKey, string | null> = {
  // SFX - Kenney.nl (CC0)
  [SFX_KEYS.COIN_PICKUP]: null, // 'sfx/coin.ogg'
  [SFX_KEYS.FUEL_PICKUP]: null, // 'sfx/powerup.ogg'
  [SFX_KEYS.CRASH]: null, // 'sfx/crash.ogg'
  [SFX_KEYS.FLIP]: null, // 'sfx/whoosh.ogg'
  [SFX_KEYS.ENGINE_START]: null, // 'sfx/engine_start.ogg'
  [SFX_KEYS.ENGINE_LOOP]: null, // 'sfx/engine_loop.ogg'
  [SFX_KEYS.BRAKE]: null, // 'sfx/brake.ogg'
  [SFX_KEYS.LANDING]: null, // 'sfx/landing.ogg'
  [SFX_KEYS.UI_CLICK]: null, // 'sfx/click.ogg'
  [SFX_KEYS.BUTTON_TAP]: null, // 'sfx/switch.ogg'
  [SFX_KEYS.UPGRADE]: null, // 'sfx/confirm.ogg'
  [SFX_KEYS.NEW_BEST]: null, // 'sfx/jingle.ogg'

  // Music - OpenGameArt (CC0)
  [MUSIC_KEYS.MENU_THEME]: null, // 'music/menu_theme.ogg'
  [MUSIC_KEYS.GAMEPLAY_LOOP]: null, // 'music/gameplay_loop.ogg'
};

/**
 * Audio attribution for open source compliance
 */
export const AUDIO_ATTRIBUTION = {
  sfx: 'Sound effects from Kenney.nl (CC0 1.0 Universal)',
  music: 'Music from OpenGameArt.org (CC0 1.0 Universal)',
};
