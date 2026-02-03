using UnityEngine;
using System;

namespace SummitWheels.Systems
{
    public class FuelSystem : MonoBehaviour
    {
        [Header("Settings")]
        public float maxFuel = 100f;
        public float consumptionRate = 1f;

        [Header("State")]
        public float currentFuel;

        public event Action<float, float> OnFuelChanged;
        public event Action OnFuelEmpty;

        private bool fuelWarningTriggered;

        public void Initialize(float capacity, float consumption)
        {
            maxFuel = capacity;
            consumptionRate = consumption;
            currentFuel = maxFuel;
            fuelWarningTriggered = false;
        }

        public void ConsumeFuel(float amount)
        {
            float previousFuel = currentFuel;
            currentFuel = Mathf.Max(0, currentFuel - amount);

            if (Mathf.Abs(previousFuel - currentFuel) > 0.01f)
            {
                OnFuelChanged?.Invoke(currentFuel, maxFuel);
            }

            // Trigger warning at 25%
            if (!fuelWarningTriggered && currentFuel <= maxFuel * 0.25f)
            {
                fuelWarningTriggered = true;
                Debug.Log("Fuel low warning!");
            }

            if (currentFuel <= 0)
            {
                OnFuelEmpty?.Invoke();
            }
        }

        public void AddFuel(float amount)
        {
            float previousFuel = currentFuel;
            currentFuel = Mathf.Min(maxFuel, currentFuel + amount);

            if (currentFuel > maxFuel * 0.25f)
            {
                fuelWarningTriggered = false;
            }

            if (Mathf.Abs(previousFuel - currentFuel) > 0.01f)
            {
                OnFuelChanged?.Invoke(currentFuel, maxFuel);
            }
        }

        public void Refuel()
        {
            currentFuel = maxFuel;
            fuelWarningTriggered = false;
            OnFuelChanged?.Invoke(currentFuel, maxFuel);
        }

        public bool IsEmpty() => currentFuel <= 0;

        public float GetFuelPercentage() => currentFuel / maxFuel;
    }
}
