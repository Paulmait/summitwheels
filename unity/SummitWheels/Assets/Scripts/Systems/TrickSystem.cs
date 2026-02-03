using UnityEngine;
using System;
using SummitWheels.Vehicle;

namespace SummitWheels.Systems
{
    public class TrickSystem : MonoBehaviour
    {
        [Header("Settings")]
        public float flipThreshold = 360f;
        public float bigAirThreshold = 2f;
        public float perfectLandingAngle = 15f;

        [Header("Points")]
        public int frontflipPoints = 100;
        public int backflipPoints = 100;
        public int doubleFlipPoints = 300;
        public int bigAirPointsPerSecond = 50;
        public int perfectLandingBonus = 50;

        [Header("State")]
        public float totalRotation;
        public int flipCount;
        public TrickType lastTrick;

        public event Action<TrickType, int> OnTrickCompleted;

        private VehicleController vehicle;
        private float lastRotation;
        private ComboSystem comboSystem;
        private BoostSystem boostSystem;

        public void Initialize(VehicleController vehicleController)
        {
            vehicle = vehicleController;
            comboSystem = GetComponent<ComboSystem>() ?? gameObject.AddComponent<ComboSystem>();
            boostSystem = GetComponent<BoostSystem>();
            Reset();
        }

        void FixedUpdate()
        {
            if (vehicle == null || vehicle.isGrounded || vehicle.isCrashed) return;

            // Track rotation while airborne
            float currentRotation = vehicle.rotationAngle;
            float deltaRotation = Mathf.DeltaAngle(lastRotation, currentRotation);
            totalRotation += deltaRotation;
            lastRotation = currentRotation;

            // Check for complete flips
            int currentFlips = Mathf.FloorToInt(Mathf.Abs(totalRotation) / flipThreshold);
            while (flipCount < currentFlips)
            {
                flipCount++;
                bool isForward = totalRotation > 0;
                CompleteTrick(isForward ? TrickType.Frontflip : TrickType.Backflip);
            }
        }

        public void OnLanded(float airTime, float landingAngle)
        {
            // Check for big air
            if (airTime >= bigAirThreshold)
            {
                int points = Mathf.RoundToInt(airTime * bigAirPointsPerSecond);
                OnTrickCompleted?.Invoke(TrickType.BigAir, points);
                comboSystem?.AddTrick(TrickType.BigAir, points);
                boostSystem?.AddBoostFromTrick(points);
            }

            // Check for perfect landing
            if (Mathf.Abs(landingAngle) <= perfectLandingAngle)
            {
                OnTrickCompleted?.Invoke(TrickType.PerfectLanding, perfectLandingBonus);
                comboSystem?.AddTrick(TrickType.PerfectLanding, perfectLandingBonus);
            }

            // Check for double flip bonus
            if (flipCount >= 2)
            {
                int doubleFlipBonus = (flipCount - 1) * doubleFlipPoints;
                OnTrickCompleted?.Invoke(TrickType.DoubleFlip, doubleFlipBonus);
                comboSystem?.AddTrick(TrickType.DoubleFlip, doubleFlipBonus);
                boostSystem?.AddBoostFromTrick(doubleFlipBonus);
            }

            // Reset for next airtime
            Reset();
        }

        private void CompleteTrick(TrickType trick)
        {
            int points = trick == TrickType.Frontflip ? frontflipPoints : backflipPoints;
            lastTrick = trick;

            OnTrickCompleted?.Invoke(trick, points);
            comboSystem?.AddTrick(trick, points);
            boostSystem?.AddBoostFromTrick(points);

            Core.GameManager.Instance.currentTricks++;

            Debug.Log($"Trick completed: {trick} for {points} points!");
        }

        public void Reset()
        {
            totalRotation = 0f;
            flipCount = 0;
            lastRotation = vehicle != null ? vehicle.rotationAngle : 0f;
        }
    }

    public enum TrickType
    {
        None,
        Frontflip,
        Backflip,
        DoubleFlip,
        BigAir,
        PerfectLanding
    }
}
