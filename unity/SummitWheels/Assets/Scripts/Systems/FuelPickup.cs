using UnityEngine;
using SummitWheels.Vehicle;
using SummitWheels.Core;

namespace SummitWheels.Systems
{
    public class FuelPickup : MonoBehaviour
    {
        [Header("Settings")]
        public float fuelAmount = 25f;

        [Header("Effects")]
        public AudioClip pickupSound;
        public GameObject pickupEffect;

        [Header("Visual")]
        public float bobSpeed = 2f;
        public float bobAmount = 0.2f;
        public float rotateSpeed = 45f;

        private Vector3 startPosition;

        void Start()
        {
            startPosition = transform.position;
        }

        void Update()
        {
            // Bob up and down
            Vector3 pos = startPosition;
            pos.y += Mathf.Sin(Time.time * bobSpeed) * bobAmount;
            transform.position = pos;

            // Rotate
            transform.Rotate(0, 0, rotateSpeed * Time.deltaTime);
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            VehicleController vehicle = other.GetComponentInParent<VehicleController>();
            if (vehicle != null)
            {
                Collect(vehicle);
            }
        }

        private void Collect(VehicleController vehicle)
        {
            // Apply stage multiplier
            float multiplier = 1f;
            if (GameManager.Instance?.selectedStage != null)
            {
                multiplier = GameManager.Instance.selectedStage.fuelPickupMultiplier;
            }

            float finalAmount = fuelAmount * multiplier;
            vehicle.AddFuel(finalAmount);

            // Play effects
            if (pickupSound != null)
            {
                AudioSource.PlayClipAtPoint(pickupSound, transform.position);
            }

            if (pickupEffect != null)
            {
                Instantiate(pickupEffect, transform.position, Quaternion.identity);
            }

            Debug.Log($"Fuel collected: +{finalAmount}");

            // Destroy pickup
            Destroy(gameObject);
        }
    }
}
