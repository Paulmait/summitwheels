/**
 * Tests for Achievement System
 */

import {
  createAchievementSystem,
  AchievementSystem,
  ACHIEVEMENTS,
  getAchievementTierColor,
  getCategoryIcon,
} from '../achievements';

describe('AchievementSystem', () => {
  let achievementSystem: AchievementSystem;

  beforeEach(() => {
    achievementSystem = createAchievementSystem();
  });

  describe('initialization', () => {
    it('should have all achievements defined', () => {
      const all = achievementSystem.getAllAchievements();

      expect(all.length).toBeGreaterThan(0);
      expect(all.length).toBe(ACHIEVEMENTS.length);
    });

    it('should start with no unlocked achievements', () => {
      const unlocked = achievementSystem.getUnlocked();

      expect(unlocked).toHaveLength(0);
    });

    it('should initialize progress for all achievements', () => {
      ACHIEVEMENTS.forEach((achievement) => {
        const progress = achievementSystem.getProgress(achievement.id);
        expect(progress.current).toBe(0);
        expect(progress.unlocked).toBe(false);
      });
    });
  });

  describe('getAchievement', () => {
    it('should return achievement by ID', () => {
      const achievement = achievementSystem.getAchievement('first_steps');

      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe('First Steps');
    });

    it('should return undefined for unknown ID', () => {
      const achievement = achievementSystem.getAchievement('nonexistent');

      expect(achievement).toBeUndefined();
    });
  });

  describe('updateProgress', () => {
    it('should update progress value', () => {
      achievementSystem.updateProgress('first_steps', 50);

      const progress = achievementSystem.getProgress('first_steps');
      expect(progress.current).toBe(50);
    });

    it('should unlock achievement when target reached', () => {
      achievementSystem.updateProgress('first_steps', 100);

      const progress = achievementSystem.getProgress('first_steps');
      expect(progress.unlocked).toBe(true);
      expect(progress.unlockedAt).toBeDefined();
    });

    it('should not unlock before target', () => {
      achievementSystem.updateProgress('first_steps', 50);

      const progress = achievementSystem.getProgress('first_steps');
      expect(progress.unlocked).toBe(false);
    });

    it('should return null for unknown achievement', () => {
      const result = achievementSystem.updateProgress('nonexistent', 100);

      expect(result).toBeNull();
    });
  });

  describe('incrementProgress', () => {
    it('should increment by 1 by default', () => {
      achievementSystem.incrementProgress('first_flip');

      const progress = achievementSystem.getProgress('first_flip');
      expect(progress.current).toBe(1);
    });

    it('should increment by specified amount', () => {
      achievementSystem.incrementProgress('coin_collector', 500);

      const progress = achievementSystem.getProgress('coin_collector');
      expect(progress.current).toBe(500);
    });

    it('should accumulate increments', () => {
      achievementSystem.incrementProgress('coin_collector', 300);
      achievementSystem.incrementProgress('coin_collector', 400);

      const progress = achievementSystem.getProgress('coin_collector');
      expect(progress.current).toBe(700);
    });
  });

  describe('isUnlocked', () => {
    it('should return false when not unlocked', () => {
      expect(achievementSystem.isUnlocked('first_steps')).toBe(false);
    });

    it('should return true when unlocked', () => {
      achievementSystem.updateProgress('first_steps', 100);

      expect(achievementSystem.isUnlocked('first_steps')).toBe(true);
    });
  });

  describe('claimReward', () => {
    it('should return null if not unlocked', () => {
      const reward = achievementSystem.claimReward('first_steps');

      expect(reward).toBeNull();
    });

    it('should return reward when unlocked', () => {
      achievementSystem.updateProgress('first_steps', 100);
      const reward = achievementSystem.claimReward('first_steps');

      expect(reward).not.toBeNull();
      expect(reward?.coins).toBe(100);
    });

    it('should mark reward as claimed', () => {
      achievementSystem.updateProgress('first_steps', 100);
      achievementSystem.claimReward('first_steps');

      const progress = achievementSystem.getProgress('first_steps');
      expect(progress.rewardClaimed).toBe(true);
    });

    it('should not allow claiming twice', () => {
      achievementSystem.updateProgress('first_steps', 100);
      achievementSystem.claimReward('first_steps');

      const secondClaim = achievementSystem.claimReward('first_steps');
      expect(secondClaim).toBeNull();
    });

    it('should include unlock reward if present', () => {
      // Legend achievement has vehicle unlock
      achievementSystem.updateProgress('legend', 10000);
      const reward = achievementSystem.claimReward('legend');

      expect(reward?.unlock).toBe('moon_rover');
    });
  });

  describe('getUnlocked', () => {
    it('should return only unlocked achievements', () => {
      achievementSystem.updateProgress('first_steps', 100);
      achievementSystem.updateProgress('first_flip', 1);

      const unlocked = achievementSystem.getUnlocked();

      expect(unlocked).toHaveLength(2);
      expect(unlocked.map((a) => a.id)).toContain('first_steps');
      expect(unlocked.map((a) => a.id)).toContain('first_flip');
    });
  });

  describe('getByCategory', () => {
    it('should return achievements in category', () => {
      const distance = achievementSystem.getByCategory('distance');

      expect(distance.length).toBeGreaterThan(0);
      expect(distance.every((a) => a.category === 'distance')).toBe(true);
    });

    it('should return secret achievements', () => {
      const secrets = achievementSystem.getByCategory('secret');

      expect(secrets.length).toBeGreaterThan(0);
      expect(secrets.every((a) => a.isSecret)).toBe(true);
    });
  });

  describe('export/load progress', () => {
    it('should export current progress', () => {
      achievementSystem.updateProgress('first_steps', 50);
      achievementSystem.updateProgress('first_flip', 1);

      const exported = achievementSystem.exportProgress();

      expect(exported['first_steps'].current).toBe(50);
      expect(exported['first_flip'].unlocked).toBe(true);
    });

    it('should load progress correctly', () => {
      const data = {
        first_steps: {
          achievementId: 'first_steps',
          current: 75,
          unlocked: false,
          rewardClaimed: false,
        },
        first_flip: {
          achievementId: 'first_flip',
          current: 1,
          unlocked: true,
          unlockedAt: 12345,
          rewardClaimed: true,
        },
      };

      achievementSystem.loadProgress(data);

      expect(achievementSystem.getProgress('first_steps').current).toBe(75);
      expect(achievementSystem.getProgress('first_flip').unlocked).toBe(true);
      expect(achievementSystem.getProgress('first_flip').rewardClaimed).toBe(true);
    });
  });

  describe('getUnclaimedCoins', () => {
    it('should return 0 when no unclaimed rewards', () => {
      expect(achievementSystem.getUnclaimedCoins()).toBe(0);
    });

    it('should sum unclaimed rewards', () => {
      achievementSystem.updateProgress('first_steps', 100); // 100 coins
      achievementSystem.updateProgress('first_flip', 1); // 100 coins

      expect(achievementSystem.getUnclaimedCoins()).toBe(200);
    });

    it('should not count claimed rewards', () => {
      achievementSystem.updateProgress('first_steps', 100);
      achievementSystem.claimReward('first_steps');

      expect(achievementSystem.getUnclaimedCoins()).toBe(0);
    });
  });
});

describe('Achievement helpers', () => {
  describe('getAchievementTierColor', () => {
    it('should return correct colors', () => {
      expect(getAchievementTierColor('bronze')).toBe('#CD7F32');
      expect(getAchievementTierColor('silver')).toBe('#C0C0C0');
      expect(getAchievementTierColor('gold')).toBe('#FFD700');
      expect(getAchievementTierColor('platinum')).toBe('#E5E4E2');
    });
  });

  describe('getCategoryIcon', () => {
    it('should return icons for categories', () => {
      expect(getCategoryIcon('distance')).toBe('🛣️');
      expect(getCategoryIcon('tricks')).toBe('🤸');
      expect(getCategoryIcon('collection')).toBe('💰');
      expect(getCategoryIcon('mastery')).toBe('⭐');
      expect(getCategoryIcon('secret')).toBe('🔒');
    });
  });
});

describe('Achievement data integrity', () => {
  it('should have unique IDs', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have positive targets', () => {
    ACHIEVEMENTS.forEach((a) => {
      expect(a.target).toBeGreaterThan(0);
    });
  });

  it('should have positive rewards', () => {
    ACHIEVEMENTS.forEach((a) => {
      expect(a.rewardCoins).toBeGreaterThan(0);
    });
  });

  it('should have valid tiers', () => {
    const validTiers = ['bronze', 'silver', 'gold', 'platinum'];

    ACHIEVEMENTS.forEach((a) => {
      expect(validTiers).toContain(a.tier);
    });
  });
});
