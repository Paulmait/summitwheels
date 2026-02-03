using UnityEngine;
using System;
using System.Collections.Generic;
using SummitWheels.Core;

namespace SummitWheels.Systems
{
    public class DailyRewardSystem : MonoBehaviour
    {
        public static DailyRewardSystem Instance { get; private set; }

        [Header("Reward Configuration")]
        public int[] dailyRewards = { 100, 150, 200, 300, 400, 500, 1000 };
        public int comebackReward = 250;
        public int maxStreak = 7;

        [Header("Streak Bonuses")]
        public float[] streakMultipliers = { 1f, 1.1f, 1.2f, 1.3f, 1.5f, 1.75f, 2f };

        [Header("Free Spin")]
        public int freeSpinsPerDay = 1;
        public int spinCost = 100;

        [Header("State")]
        public int currentStreak;
        public int freeSpinsRemaining;
        public bool hasClaimedToday;

        public event Action<int, int> OnRewardClaimed;
        public event Action<int> OnStreakUpdated;

        private string lastClaimDate;
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
            LoadState();
            CheckDailyReset();
        }

        private void LoadState()
        {
            if (saveManager != null)
            {
                currentStreak = saveManager.Progress.dailyStreak;
                lastClaimDate = saveManager.Progress.lastLoginDate;
            }
        }

        private void SaveState()
        {
            if (saveManager != null)
            {
                saveManager.Progress.dailyStreak = currentStreak;
                saveManager.Progress.lastLoginDate = lastClaimDate;
                saveManager.Save();
            }
        }

        public void CheckDailyReset()
        {
            string today = DateTime.Now.ToString("yyyy-MM-dd");

            if (lastClaimDate == today)
            {
                hasClaimedToday = true;
                return;
            }

            // Check if streak should continue or reset
            if (!string.IsNullOrEmpty(lastClaimDate))
            {
                DateTime lastDate = DateTime.Parse(lastClaimDate);
                TimeSpan timeSince = DateTime.Now - lastDate;

                if (timeSince.TotalDays > 2)
                {
                    // Streak broken - more than 1 day gap
                    currentStreak = 0;
                    Debug.Log("Streak broken! Starting over.");
                }
            }

            hasClaimedToday = false;
            freeSpinsRemaining = freeSpinsPerDay;
        }

        public bool CanClaimDaily()
        {
            return !hasClaimedToday;
        }

        public int ClaimDailyReward()
        {
            if (hasClaimedToday)
            {
                Debug.Log("Already claimed today's reward!");
                return 0;
            }

            // Increment streak
            currentStreak = Mathf.Min(currentStreak + 1, maxStreak);

            // Get reward with streak multiplier
            int dayIndex = (currentStreak - 1) % dailyRewards.Length;
            int baseReward = dailyRewards[dayIndex];
            float multiplier = streakMultipliers[Mathf.Min(currentStreak - 1, streakMultipliers.Length - 1)];
            int finalReward = Mathf.RoundToInt(baseReward * multiplier);

            // Update state
            hasClaimedToday = true;
            lastClaimDate = DateTime.Now.ToString("yyyy-MM-dd");

            // Give reward
            saveManager?.AddCoins(finalReward, $"Daily Reward Day {currentStreak}");

            SaveState();

            OnRewardClaimed?.Invoke(currentStreak, finalReward);
            OnStreakUpdated?.Invoke(currentStreak);

            Debug.Log($"Claimed Day {currentStreak} reward: {finalReward} coins (x{multiplier} streak bonus)");

            return finalReward;
        }

        public int ClaimComebackReward()
        {
            // Comeback reward for returning after streak break
            if (currentStreak > 0) return 0;

            saveManager?.AddCoins(comebackReward, "Comeback Bonus");
            Debug.Log($"Welcome back! Claimed comeback reward: {comebackReward} coins");

            return comebackReward;
        }

        public bool CanSpin()
        {
            return freeSpinsRemaining > 0 || (saveManager?.Progress.coins >= spinCost);
        }

        public bool HasFreeSpin()
        {
            return freeSpinsRemaining > 0;
        }

        public void UseSpin(bool free)
        {
            if (free && freeSpinsRemaining > 0)
            {
                freeSpinsRemaining--;
            }
            else if (!free)
            {
                saveManager?.SpendCoins(spinCost, "Lucky Spin");
            }
        }

        public TimeSpan GetTimeUntilNextDay()
        {
            DateTime now = DateTime.Now;
            DateTime tomorrow = now.Date.AddDays(1);
            return tomorrow - now;
        }

        public List<DailyRewardData> GetRewardCalendar()
        {
            var calendar = new List<DailyRewardData>();

            for (int i = 0; i < dailyRewards.Length; i++)
            {
                int day = i + 1;
                float multiplier = streakMultipliers[Mathf.Min(i, streakMultipliers.Length - 1)];
                int reward = Mathf.RoundToInt(dailyRewards[i] * multiplier);

                calendar.Add(new DailyRewardData
                {
                    day = day,
                    baseReward = dailyRewards[i],
                    multiplier = multiplier,
                    totalReward = reward,
                    isClaimed = day <= currentStreak && hasClaimedToday,
                    isToday = day == currentStreak + 1 && !hasClaimedToday,
                    isLocked = day > currentStreak + 1
                });
            }

            return calendar;
        }
    }

    [System.Serializable]
    public class DailyRewardData
    {
        public int day;
        public int baseReward;
        public float multiplier;
        public int totalReward;
        public bool isClaimed;
        public bool isToday;
        public bool isLocked;
    }
}
