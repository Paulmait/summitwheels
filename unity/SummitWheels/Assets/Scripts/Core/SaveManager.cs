using UnityEngine;
using System.Collections.Generic;
using SummitWheels.Data;

namespace SummitWheels.Core
{
    public class SaveManager : MonoBehaviour
    {
        private const string SAVE_KEY = "SummitWheels_Progress";
        private const string INTEGRITY_SALT = "SW_2026_SECURE_";

        public PlayerProgress Progress { get; private set; }

        void Awake()
        {
            Progress = new PlayerProgress();
        }

        public void Save()
        {
            // Generate integrity checksum
            Progress.checksum = GenerateChecksum(Progress);

            string json = JsonUtility.ToJson(Progress);
            PlayerPrefs.SetString(SAVE_KEY, json);
            PlayerPrefs.Save();
        }

        public void Load()
        {
            if (PlayerPrefs.HasKey(SAVE_KEY))
            {
                string json = PlayerPrefs.GetString(SAVE_KEY);
                Progress = JsonUtility.FromJson<PlayerProgress>(json);

                // Validate integrity
                string expectedChecksum = GenerateChecksum(Progress);
                if (Progress.checksum != expectedChecksum)
                {
                    Debug.LogWarning("Save data integrity check failed! Possible tampering detected.");
                    // Reset to safe defaults but keep non-monetary progress
                    Progress.coins = 0;
                }

                // Initialize collections if null
                Progress.unlockedVehicles ??= new List<string> { "jeep" };
                Progress.unlockedStages ??= new List<string> { "countryside" };
                Progress.vehicleUpgrades ??= new SerializableDictionary<string, UpgradeLevels>();
                Progress.achievements ??= new SerializableDictionary<string, AchievementProgress>();
            }
            else
            {
                Progress = CreateNewProgress();
            }
        }

        private PlayerProgress CreateNewProgress()
        {
            return new PlayerProgress
            {
                coins = 0,
                totalCoins = 0,
                bestDistance = 0,
                totalRuns = 0,
                unlockedVehicles = new List<string> { "jeep" },
                selectedVehicle = "jeep",
                vehicleUpgrades = new SerializableDictionary<string, UpgradeLevels>(),
                unlockedStages = new List<string> { "countryside" },
                selectedStage = "countryside",
                totalAirTime = 0,
                totalTricks = 0,
                highestCombo = 0,
                achievements = new SerializableDictionary<string, AchievementProgress>(),
                dailyStreak = 0,
                lastLoginDate = "",
                checksum = ""
            };
        }

        private string GenerateChecksum(PlayerProgress progress)
        {
            string data = $"{INTEGRITY_SALT}{progress.coins}_{progress.totalCoins}_{progress.totalRuns}";
            int hash = 0;
            foreach (char c in data)
            {
                hash = ((hash << 5) - hash) + c;
                hash &= hash;
            }
            return Mathf.Abs(hash).ToString("X");
        }

        public void ResetProgress()
        {
            Progress = CreateNewProgress();
            Save();
        }

        public void AddCoins(int amount, string source)
        {
            Progress.coins += amount;
            Progress.totalCoins += amount;
            Debug.Log($"Added {amount} coins from {source}. New balance: {Progress.coins}");
            Save();
        }

        public bool SpendCoins(int amount, string purpose)
        {
            if (Progress.coins < amount)
            {
                Debug.LogWarning($"Not enough coins to spend {amount} for {purpose}");
                return false;
            }
            Progress.coins -= amount;
            Debug.Log($"Spent {amount} coins for {purpose}. New balance: {Progress.coins}");
            Save();
            return true;
        }
    }

    [System.Serializable]
    public class PlayerProgress
    {
        public int coins;
        public int totalCoins;
        public float bestDistance;
        public int totalRuns;
        public List<string> unlockedVehicles;
        public string selectedVehicle;
        public SerializableDictionary<string, UpgradeLevels> vehicleUpgrades;
        public List<string> unlockedStages;
        public string selectedStage;
        public float totalAirTime;
        public int totalTricks;
        public int highestCombo;
        public SerializableDictionary<string, AchievementProgress> achievements;
        public int dailyStreak;
        public string lastLoginDate;
        public string checksum;
    }

    // Unity-compatible serializable dictionary
    [System.Serializable]
    public class SerializableDictionary<TKey, TValue> : Dictionary<TKey, TValue>, ISerializationCallbackReceiver
    {
        [SerializeField] private List<TKey> keys = new List<TKey>();
        [SerializeField] private List<TValue> values = new List<TValue>();

        public void OnBeforeSerialize()
        {
            keys.Clear();
            values.Clear();
            foreach (var pair in this)
            {
                keys.Add(pair.Key);
                values.Add(pair.Value);
            }
        }

        public void OnAfterDeserialize()
        {
            Clear();
            for (int i = 0; i < keys.Count && i < values.Count; i++)
            {
                this[keys[i]] = values[i];
            }
        }
    }
}
