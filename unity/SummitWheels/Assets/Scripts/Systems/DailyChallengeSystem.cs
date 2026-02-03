using UnityEngine;
using System;
using System.Collections.Generic;

namespace SummitWheels.Systems
{
    public class DailyChallengeSystem : MonoBehaviour
    {
        public static DailyChallengeSystem Instance { get; private set; }

        [Header("Current Challenge")]
        public DailyChallenge todaysChallenge;
        public bool isPlayingChallenge;
        public float challengeProgress;

        public event Action<DailyChallenge> OnChallengeGenerated;
        public event Action<float> OnProgressUpdated;
        public event Action<int> OnChallengeCompleted;

        private string lastChallengeDate;

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
            CheckAndGenerateDailyChallenge();
        }

        public void CheckAndGenerateDailyChallenge()
        {
            string today = DateTime.Now.ToString("yyyy-MM-dd");

            if (lastChallengeDate != today)
            {
                GenerateChallenge(today);
                lastChallengeDate = today;
            }

            OnChallengeGenerated?.Invoke(todaysChallenge);
        }

        private void GenerateChallenge(string dateSeed)
        {
            // Use date as seed for deterministic daily challenge
            int seed = dateSeed.GetHashCode();
            UnityEngine.Random.InitState(seed);

            // Select random modifiers (1-2)
            var availableModifiers = new List<ChallengeModifier>
            {
                ChallengeModifier.LowGravity,
                ChallengeModifier.HighGravity,
                ChallengeModifier.Slippery,
                ChallengeModifier.Sticky,
                ChallengeModifier.DoubleCoins,
                ChallengeModifier.HalfFuel,
                ChallengeModifier.NoBrakes,
                ChallengeModifier.SuperBoost,
                ChallengeModifier.GiantWheels,
                ChallengeModifier.TinyVehicle,
                ChallengeModifier.ReverseControls,
                ChallengeModifier.Fog
            };

            int modifierCount = UnityEngine.Random.Range(1, 3);
            var selectedModifiers = new List<ChallengeModifier>();
            for (int i = 0; i < modifierCount && availableModifiers.Count > 0; i++)
            {
                int index = UnityEngine.Random.Range(0, availableModifiers.Count);
                selectedModifiers.Add(availableModifiers[index]);
                availableModifiers.RemoveAt(index);
            }

            // Select goal type
            var goalTypes = new[] { GoalType.Distance, GoalType.Coins, GoalType.Tricks, GoalType.Airtime };
            GoalType goalType = goalTypes[UnityEngine.Random.Range(0, goalTypes.Length)];

            // Generate goal target based on type
            float goalTarget = goalType switch
            {
                GoalType.Distance => UnityEngine.Random.Range(3, 8) * 500f,  // 1500-4000m
                GoalType.Coins => UnityEngine.Random.Range(50, 200) * 10,    // 500-2000 coins
                GoalType.Tricks => UnityEngine.Random.Range(5, 15),           // 5-15 tricks
                GoalType.Airtime => UnityEngine.Random.Range(15, 45),         // 15-45 seconds
                _ => 1000f
            };

            // Calculate reward based on difficulty
            int baseReward = 500;
            float difficultyMultiplier = 1f + (modifierCount * 0.5f);
            int reward = Mathf.RoundToInt(baseReward * difficultyMultiplier);

            todaysChallenge = new DailyChallenge
            {
                date = dateSeed,
                modifiers = selectedModifiers,
                goalType = goalType,
                goalTarget = goalTarget,
                reward = reward,
                isCompleted = false
            };

            Debug.Log($"Generated daily challenge: {goalType} {goalTarget} with {string.Join(", ", selectedModifiers)}");
        }

        public void StartChallenge()
        {
            if (todaysChallenge.isCompleted) return;

            isPlayingChallenge = true;
            challengeProgress = 0f;
            ApplyModifiers();
        }

        public void EndChallenge()
        {
            isPlayingChallenge = false;
            RemoveModifiers();
        }

        private void ApplyModifiers()
        {
            foreach (var modifier in todaysChallenge.modifiers)
            {
                ApplyModifier(modifier);
            }
        }

        private void ApplyModifier(ChallengeModifier modifier)
        {
            switch (modifier)
            {
                case ChallengeModifier.LowGravity:
                    Physics2D.gravity = new Vector2(0, -9.81f * 0.5f);
                    break;
                case ChallengeModifier.HighGravity:
                    Physics2D.gravity = new Vector2(0, -9.81f * 1.5f);
                    break;
                // Other modifiers handled by vehicle/game systems
            }
        }

        private void RemoveModifiers()
        {
            Physics2D.gravity = new Vector2(0, -9.81f);
        }

        public void UpdateProgress(float value)
        {
            challengeProgress = value;
            OnProgressUpdated?.Invoke(challengeProgress / todaysChallenge.goalTarget);

            if (challengeProgress >= todaysChallenge.goalTarget && !todaysChallenge.isCompleted)
            {
                CompleteChallenge();
            }
        }

        private void CompleteChallenge()
        {
            todaysChallenge.isCompleted = true;
            Core.GameManager.Instance?.GetComponent<Core.SaveManager>()?.AddCoins(todaysChallenge.reward, "Daily Challenge");
            OnChallengeCompleted?.Invoke(todaysChallenge.reward);
            Debug.Log($"Daily challenge completed! Reward: {todaysChallenge.reward} coins");
        }

        public bool HasModifier(ChallengeModifier modifier)
        {
            return isPlayingChallenge && todaysChallenge.modifiers.Contains(modifier);
        }
    }

    [System.Serializable]
    public class DailyChallenge
    {
        public string date;
        public List<ChallengeModifier> modifiers;
        public GoalType goalType;
        public float goalTarget;
        public int reward;
        public bool isCompleted;
    }

    public enum ChallengeModifier
    {
        LowGravity,
        HighGravity,
        Slippery,
        Sticky,
        DoubleCoins,
        HalfFuel,
        NoBrakes,
        SuperBoost,
        GiantWheels,
        TinyVehicle,
        ReverseControls,
        Fog
    }

    public enum GoalType
    {
        Distance,
        Coins,
        Tricks,
        Airtime,
        NoCrash
    }
}
