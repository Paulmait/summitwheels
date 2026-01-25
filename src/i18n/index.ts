/**
 * i18n - Internationalization system
 */

import en from './en.json';
import es from './es.json';

export type Language = 'en' | 'es';

export type TranslationKey = string;

const translations: Record<Language, Record<string, any>> = {
  en,
  es,
};

let currentLanguage: Language = 'en';

/**
 * Set the current language
 */
export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

/**
 * Get the current language
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Get a translation by key path (e.g., 'game.title')
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English
      value = translations.en;
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2];
        } else {
          return key; // Return key if not found
        }
      }
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace parameters
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() ?? match;
    });
  }

  return value;
}

/**
 * Check if all keys in source exist in target
 */
export function validateTranslations(source: Language, target: Language): string[] {
  const missing: string[] = [];

  function checkKeys(
    sourceObj: Record<string, any>,
    targetObj: Record<string, any>,
    path: string = ''
  ): void {
    for (const key of Object.keys(sourceObj)) {
      const fullPath = path ? `${path}.${key}` : key;

      if (!(key in targetObj)) {
        missing.push(fullPath);
      } else if (
        typeof sourceObj[key] === 'object' &&
        typeof targetObj[key] === 'object'
      ) {
        checkKeys(sourceObj[key], targetObj[key], fullPath);
      }
    }
  }

  checkKeys(translations[source], translations[target]);
  return missing;
}

export { en, es };
