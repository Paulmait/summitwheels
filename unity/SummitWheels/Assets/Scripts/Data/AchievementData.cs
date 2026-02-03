using UnityEngine;

namespace SummitWheels.Data
{
    [CreateAssetMenu(fileName = "NewAchievement", menuName = "Summit Wheels/Achievement Data")]
    public class AchievementData : ScriptableObject
    {
        public string id;
        public string achievementName;
        [TextArea] public string description;
        public AchievementCategory category;
        public AchievementTier tier;
        public Sprite icon;
        public int coinReward;
        public string unlockId; // Vehicle or stage ID to unlock (optional)
        public AchievementRequirement requirement;
        public bool isSecret;
    }

    [System.Serializable]
    public class AchievementRequirement
    {
        public AchievementType type;
        public float targetValue;
    }

    public enum AchievementCategory
    {
        Distance,
        Tricks,
        Collection,
        Mastery,
        Secret
    }

    public enum AchievementTier
    {
        Bronze,
        Silver,
        Gold,
        Platinum
    }

    public enum AchievementType
    {
        TotalDistance,
        SingleRunDistance,
        TotalCoins,
        TotalTricks,
        SingleRunTricks,
        TotalFlips,
        HighestCombo,
        TotalAirtime,
        VehiclesOwned,
        StagesUnlocked,
        FullyUpgradedVehicles,
        DailyChallengesCompleted,
        PerfectLandings
    }

    [System.Serializable]
    public class AchievementProgress
    {
        public string achievementId;
        public float currentValue;
        public bool isUnlocked;
        public System.DateTime? unlockedAt;
    }
}
