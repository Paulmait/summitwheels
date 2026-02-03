using UnityEngine;
using System;

namespace SummitWheels.Systems
{
    public class ComboSystem : MonoBehaviour
    {
        [Header("Settings")]
        public float comboWindow = 3f;
        public float multiplierIncrement = 0.2f;
        public float maxMultiplier = 5f;

        [Header("Tier Thresholds")]
        public int niceTierTricks = 5;
        public int greatTierTricks = 10;
        public int awesomeTierTricks = 15;
        public int legendaryTierTricks = 20;

        [Header("Tier Rewards")]
        public int niceReward = 100;
        public int greatReward = 500;
        public int awesomeReward = 2000;
        public int legendaryReward = 10000;

        [Header("State")]
        public int currentComboCount;
        public float currentMultiplier = 1f;
        public int currentComboPoints;
        public ComboTier currentTier = ComboTier.None;

        public event Action<int, float> OnComboUpdated;
        public event Action<ComboTier, int> OnTierReached;
        public event Action<int> OnComboEnded;

        private float comboTimer;
        private ComboTier highestTierThisCombo = ComboTier.None;

        void Update()
        {
            if (currentComboCount > 0)
            {
                comboTimer -= Time.deltaTime;

                if (comboTimer <= 0)
                {
                    EndCombo();
                }
            }
        }

        public void AddTrick(TrickType trick, int basePoints)
        {
            currentComboCount++;
            comboTimer = comboWindow;

            // Update multiplier
            currentMultiplier = Mathf.Min(maxMultiplier, 1f + (currentComboCount - 1) * multiplierIncrement);

            // Calculate points with multiplier
            int points = Mathf.RoundToInt(basePoints * currentMultiplier);
            currentComboPoints += points;

            // Update game manager combo
            if (Core.GameManager.Instance != null)
            {
                if (currentComboCount > Core.GameManager.Instance.currentCombo)
                {
                    Core.GameManager.Instance.currentCombo = currentComboCount;
                }
            }

            // Check for tier upgrades
            CheckTierProgress();

            OnComboUpdated?.Invoke(currentComboCount, currentMultiplier);
            Debug.Log($"Combo: {currentComboCount}x (x{currentMultiplier:F1}) - {currentComboPoints} pts");
        }

        private void CheckTierProgress()
        {
            ComboTier newTier = GetCurrentTier();

            if (newTier > highestTierThisCombo)
            {
                highestTierThisCombo = newTier;
                currentTier = newTier;

                int tierReward = GetTierReward(newTier);
                if (tierReward > 0)
                {
                    Core.GameManager.Instance?.AddCoins(tierReward);
                    OnTierReached?.Invoke(newTier, tierReward);
                    Debug.Log($"Combo tier reached: {newTier} (+{tierReward} coins)");
                }
            }
        }

        private ComboTier GetCurrentTier()
        {
            if (currentComboCount >= legendaryTierTricks) return ComboTier.Legendary;
            if (currentComboCount >= awesomeTierTricks) return ComboTier.Awesome;
            if (currentComboCount >= greatTierTricks) return ComboTier.Great;
            if (currentComboCount >= niceTierTricks) return ComboTier.Nice;
            return ComboTier.None;
        }

        private int GetTierReward(ComboTier tier)
        {
            return tier switch
            {
                ComboTier.Nice => niceReward,
                ComboTier.Great => greatReward,
                ComboTier.Awesome => awesomeReward,
                ComboTier.Legendary => legendaryReward,
                _ => 0
            };
        }

        public void EndCombo()
        {
            if (currentComboCount > 0)
            {
                OnComboEnded?.Invoke(currentComboPoints);
                Debug.Log($"Combo ended: {currentComboCount} tricks for {currentComboPoints} points");
            }

            ResetCombo();
        }

        public void ResetCombo()
        {
            currentComboCount = 0;
            currentMultiplier = 1f;
            currentComboPoints = 0;
            currentTier = ComboTier.None;
            highestTierThisCombo = ComboTier.None;
            comboTimer = 0f;
        }

        public float GetTimeRemaining() => comboTimer;

        public float GetTimeRemainingPercent() => comboTimer / comboWindow;
    }

    public enum ComboTier
    {
        None,
        Nice,
        Great,
        Awesome,
        Legendary
    }
}
