using UnityEngine;
using System.Collections.Generic;

namespace SummitWheels.Data
{
    [CreateAssetMenu(fileName = "AchievementDatabase", menuName = "Summit Wheels/Achievement Database")]
    public class AchievementDatabase : ScriptableObject
    {
        public List<AchievementData> achievements = new List<AchievementData>();

        public AchievementData GetAchievement(string id)
        {
            return achievements.Find(a => a.id == id);
        }

        public List<AchievementData> GetByCategory(AchievementCategory category)
        {
            return achievements.FindAll(a => a.category == category);
        }

        public List<AchievementData> GetByTier(AchievementTier tier)
        {
            return achievements.FindAll(a => a.tier == tier);
        }

        public int GetTotalCount() => achievements.Count;

#if UNITY_EDITOR
        [ContextMenu("Create Default Achievements")]
        public void CreateDefaultAchievements()
        {
            achievements.Clear();

            // Distance achievements
            AddAchievement("first_steps", "First Steps", "Travel 100 meters", AchievementCategory.Distance, AchievementTier.Bronze, AchievementType.TotalDistance, 100, 50);
            AddAchievement("going_places", "Going Places", "Travel 1,000 meters", AchievementCategory.Distance, AchievementTier.Silver, AchievementType.TotalDistance, 1000, 200);
            AddAchievement("marathon", "Marathon Runner", "Travel 10,000 meters", AchievementCategory.Distance, AchievementTier.Gold, AchievementType.TotalDistance, 10000, 1000);
            AddAchievement("explorer", "Explorer", "Travel 50,000 meters", AchievementCategory.Distance, AchievementTier.Gold, AchievementType.TotalDistance, 50000, 5000);
            AddAchievement("legend", "Living Legend", "Travel 100,000 meters", AchievementCategory.Distance, AchievementTier.Platinum, AchievementType.TotalDistance, 100000, 10000);

            // Trick achievements
            AddAchievement("first_flip", "First Flip", "Perform your first flip", AchievementCategory.Tricks, AchievementTier.Bronze, AchievementType.TotalTricks, 1, 100);
            AddAchievement("flip_master", "Flip Master", "Perform 100 flips", AchievementCategory.Tricks, AchievementTier.Silver, AchievementType.TotalTricks, 100, 500);
            AddAchievement("air_time", "Air Time", "Accumulate 60 seconds of airtime", AchievementCategory.Tricks, AchievementTier.Silver, AchievementType.TotalAirtime, 60, 500);
            AddAchievement("combo_starter", "Combo Starter", "Reach a 5x combo", AchievementCategory.Tricks, AchievementTier.Bronze, AchievementType.HighestCombo, 5, 200);
            AddAchievement("combo_king", "Combo King", "Reach a 20x combo", AchievementCategory.Tricks, AchievementTier.Gold, AchievementType.HighestCombo, 20, 2000);

            // Collection achievements
            AddAchievement("coin_collector", "Coin Collector", "Collect 1,000 coins total", AchievementCategory.Collection, AchievementTier.Bronze, AchievementType.TotalCoins, 1000, 100);
            AddAchievement("treasure_hunter", "Treasure Hunter", "Collect 10,000 coins total", AchievementCategory.Collection, AchievementTier.Silver, AchievementType.TotalCoins, 10000, 500);
            AddAchievement("wealthy", "Wealthy", "Collect 50,000 coins total", AchievementCategory.Collection, AchievementTier.Gold, AchievementType.TotalCoins, 50000, 2000);
            AddAchievement("tycoon", "Tycoon", "Collect 200,000 coins total", AchievementCategory.Collection, AchievementTier.Platinum, AchievementType.TotalCoins, 200000, 10000);

            // Mastery achievements
            AddAchievement("all_vehicles", "Car Collector", "Own all vehicles", AchievementCategory.Mastery, AchievementTier.Gold, AchievementType.VehiclesOwned, 6, 5000);
            AddAchievement("all_stages", "World Traveler", "Unlock all stages", AchievementCategory.Mastery, AchievementTier.Gold, AchievementType.StagesUnlocked, 6, 5000);

            UnityEditor.EditorUtility.SetDirty(this);
            Debug.Log($"Created {achievements.Count} default achievements");
        }

        private void AddAchievement(string id, string name, string desc, AchievementCategory category, AchievementTier tier, AchievementType type, float target, int reward)
        {
            var achievement = ScriptableObject.CreateInstance<AchievementData>();
            achievement.id = id;
            achievement.achievementName = name;
            achievement.description = desc;
            achievement.category = category;
            achievement.tier = tier;
            achievement.coinReward = reward;
            achievement.isSecret = false;
            achievement.requirement = new AchievementRequirement
            {
                type = type,
                targetValue = target
            };
            achievements.Add(achievement);
        }
#endif
    }
}
