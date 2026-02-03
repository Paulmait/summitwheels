using UnityEngine;
using System;

namespace SummitWheels.Systems
{
    public class BoostSystem : MonoBehaviour
    {
        [Header("Settings")]
        public float maxBoost = 100f;
        public float consumptionRate = 30f;       // Units per second while boosting
        public float regenRate = 2f;              // Units per second passive regen
        public float trickGainRate = 0.2f;        // Boost per trick point
        public float minimumToActivate = 20f;
        public float cooldownDuration = 1f;
        public float powerMultiplier = 1.8f;

        [Header("State")]
        public float currentBoost;
        public bool IsBoosting { get; private set; }
        public bool IsOnCooldown { get; private set; }

        public event Action<float, float> OnBoostChanged;
        public event Action OnBoostActivated;
        public event Action OnBoostDeactivated;

        private float cooldownTimer;

        public void Initialize()
        {
            currentBoost = 0f;
            IsBoosting = false;
            IsOnCooldown = false;
            cooldownTimer = 0f;
        }

        void Update()
        {
            if (IsOnCooldown)
            {
                cooldownTimer -= Time.deltaTime;
                if (cooldownTimer <= 0)
                {
                    IsOnCooldown = false;
                }
            }

            if (IsBoosting)
            {
                ConsumeBoost(consumptionRate * Time.deltaTime);

                if (currentBoost <= 0)
                {
                    DeactivateBoost();
                }
            }
            else if (!IsOnCooldown)
            {
                // Passive regeneration
                AddBoost(regenRate * Time.deltaTime);
            }
        }

        public void AddBoostFromTrick(float trickPoints)
        {
            float boostGain = trickPoints * trickGainRate;
            AddBoost(boostGain);
        }

        public void AddBoost(float amount)
        {
            float previousBoost = currentBoost;
            currentBoost = Mathf.Min(maxBoost, currentBoost + amount);

            if (Mathf.Abs(previousBoost - currentBoost) > 0.1f)
            {
                OnBoostChanged?.Invoke(currentBoost, maxBoost);
            }
        }

        private void ConsumeBoost(float amount)
        {
            float previousBoost = currentBoost;
            currentBoost = Mathf.Max(0, currentBoost - amount);

            if (Mathf.Abs(previousBoost - currentBoost) > 0.1f)
            {
                OnBoostChanged?.Invoke(currentBoost, maxBoost);
            }
        }

        public bool TryActivateBoost()
        {
            if (IsBoosting || IsOnCooldown) return false;
            if (currentBoost < minimumToActivate) return false;

            IsBoosting = true;
            OnBoostActivated?.Invoke();
            Debug.Log("Boost activated!");
            return true;
        }

        public void DeactivateBoost()
        {
            if (!IsBoosting) return;

            IsBoosting = false;
            IsOnCooldown = true;
            cooldownTimer = cooldownDuration;
            OnBoostDeactivated?.Invoke();
            Debug.Log("Boost deactivated, entering cooldown");
        }

        public void Reset()
        {
            currentBoost = 0f;
            IsBoosting = false;
            IsOnCooldown = false;
            cooldownTimer = 0f;
            OnBoostChanged?.Invoke(currentBoost, maxBoost);
        }

        public float GetBoostPercentage() => currentBoost / maxBoost;
    }
}
