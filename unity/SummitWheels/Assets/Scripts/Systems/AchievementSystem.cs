using UnityEngine;
using System;
using System.Collections.Generic;
using SummitWheels.Data;
using SummitWheels.Core;

namespace SummitWheels.Systems
{
    public class AchievementSystem : MonoBehaviour
    {
        public static AchievementSystem Instance { get; private set; }

        [Header("Database")]
        public AchievementDatabase database;

        public event Action<AchievementData> OnAchievementUnlocked;

        private SaveManager saveManager;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Start()
        {
            saveManager = GameManager.Instance?.GetComponent<SaveManager>();
        }

        public void CheckAchievements()
        {
            if (database == null || saveManager == null) return;

            var progress = saveManager.Progress;

            foreach (var achievement in database.achievements)
            {
                if (IsUnlocked(achievement.id)) continue;

                bool earned = CheckAchievementRequirement(achievement, progress);
                if (earned)
                {
                    UnlockAchievement(achievement);
                }
            }
        }

        private bool CheckAchievementRequirement(AchievementData achievement, PlayerProgress progress)
        {
            float currentValue = GetProgressValue(achievement.requirement.type, progress);
            return currentValue >= achievement.requirement.targetValue;
        }

        private float GetProgressValue(AchievementType type, PlayerProgress progress)
        {
            return type switch
            {
                AchievementType.TotalDistance => progress.bestDistance,
                AchievementType.TotalCoins => progress.totalCoins,
                AchievementType.TotalTricks => progress.totalTricks,
                AchievementType.HighestCombo => progress.highestCombo,
                AchievementType.TotalAirtime => progress.totalAirTime,
                AchievementType.VehiclesOwned => progress.unlockedVehicles?.Count ?? 1,
                AchievementType.StagesUnlocked => progress.unlockedStages?.Count ?? 1,
                _ => 0
            };
        }

        public void UnlockAchievement(AchievementData achievement)
        {
            if (IsUnlocked(achievement.id)) return;

            var progress = new AchievementProgress
            {
                achievementId = achievement.id,
                currentValue = achievement.requirement.targetValue,
                isUnlocked = true,
                unlockedAt = DateTime.Now
            };

            saveManager.Progress.achievements[achievement.id] = progress;

            // Give reward
            if (achievement.coinReward > 0)
            {
                saveManager.AddCoins(achievement.coinReward, $"Achievement: {achievement.achievementName}");
            }

            // Unlock content if specified
            if (!string.IsNullOrEmpty(achievement.unlockId))
            {
                // Check if it's a vehicle or stage
                var vehicleDb = GameManager.Instance?.vehicleDatabase;
                if (vehicleDb != null && vehicleDb.GetVehicle(achievement.unlockId) != null)
                {
                    if (!saveManager.Progress.unlockedVehicles.Contains(achievement.unlockId))
                    {
                        saveManager.Progress.unlockedVehicles.Add(achievement.unlockId);
                    }
                }

                var stageDb = GameManager.Instance?.stageDatabase;
                if (stageDb != null && stageDb.GetStage(achievement.unlockId) != null)
                {
                    if (!saveManager.Progress.unlockedStages.Contains(achievement.unlockId))
                    {
                        saveManager.Progress.unlockedStages.Add(achievement.unlockId);
                    }
                }
            }

            saveManager.Save();
            OnAchievementUnlocked?.Invoke(achievement);
            Debug.Log($"Achievement unlocked: {achievement.achievementName}!");
        }

        public bool IsUnlocked(string achievementId)
        {
            return saveManager?.Progress.achievements?.ContainsKey(achievementId) == true &&
                   saveManager.Progress.achievements[achievementId].isUnlocked;
        }

        public float GetProgress(string achievementId)
        {
            var achievement = database?.GetAchievement(achievementId);
            if (achievement == null || saveManager == null) return 0;

            float current = GetProgressValue(achievement.requirement.type, saveManager.Progress);
            float target = achievement.requirement.targetValue;
            return Mathf.Clamp01(current / target);
        }

        public List<AchievementData> GetUnlockedAchievements()
        {
            var unlocked = new List<AchievementData>();
            if (database == null) return unlocked;

            foreach (var achievement in database.achievements)
            {
                if (IsUnlocked(achievement.id))
                {
                    unlocked.Add(achievement);
                }
            }
            return unlocked;
        }

        public List<AchievementData> GetLockedAchievements(bool includeSecret = false)
        {
            var locked = new List<AchievementData>();
            if (database == null) return locked;

            foreach (var achievement in database.achievements)
            {
                if (!IsUnlocked(achievement.id))
                {
                    if (!achievement.isSecret || includeSecret)
                    {
                        locked.Add(achievement);
                    }
                }
            }
            return locked;
        }
    }
}
