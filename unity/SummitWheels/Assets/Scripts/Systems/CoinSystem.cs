using UnityEngine;
using SummitWheels.Core;

namespace SummitWheels.Systems
{
    public class CoinSystem : MonoBehaviour
    {
        [Header("Settings")]
        public int baseValue = 10;
        public float pickupRadius = 1f;

        [Header("Effects")]
        public AudioClip pickupSound;
        public GameObject pickupEffect;

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (other.CompareTag("Player") || other.GetComponentInParent<Vehicle.VehicleController>() != null)
            {
                Collect();
            }
        }

        public void Collect()
        {
            // Calculate value with multipliers
            int value = baseValue;

            // Stage multiplier
            var stage = GameManager.Instance?.selectedStage;
            if (stage != null)
            {
                value = Mathf.RoundToInt(value * stage.coinMultiplier);
            }

            // Daily challenge double coins modifier
            if (DailyChallengeSystem.Instance != null &&
                DailyChallengeSystem.Instance.HasModifier(ChallengeModifier.DoubleCoins))
            {
                value *= 2;
            }

            // Summit Pass bonus (if applicable)
            // This would be checked via IAP system

            // Add coins
            GameManager.Instance?.AddCoins(value);

            // Play effects
            if (pickupSound != null)
            {
                AudioSource.PlayClipAtPoint(pickupSound, transform.position);
            }

            if (pickupEffect != null)
            {
                Instantiate(pickupEffect, transform.position, Quaternion.identity);
            }

            // Destroy coin
            Destroy(gameObject);
        }
    }
}
