using UnityEngine;
using SummitWheels.Core;
using SummitWheels.Data;
using SummitWheels.Systems;

namespace SummitWheels.Vehicle
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class VehicleController : MonoBehaviour
    {
        [Header("Components")]
        public Rigidbody2D rb;
        public WheelController frontWheel;
        public WheelController rearWheel;
        public Transform vehicleBody;

        [Header("Stats")]
        public VehicleStats stats;

        [Header("State")]
        public bool isGrounded;
        public bool isCrashed;
        public float currentSpeed;
        public float rotationAngle;

        [Header("Systems")]
        public FuelSystem fuelSystem;
        public BoostSystem boostSystem;
        public TrickSystem trickSystem;

        private InputManager input;
        private float airTime;
        private float lastGroundedTime;

        void Start()
        {
            rb = GetComponent<Rigidbody2D>();
            input = InputManager.Instance;

            // Initialize systems
            fuelSystem = GetComponent<FuelSystem>() ?? gameObject.AddComponent<FuelSystem>();
            boostSystem = GetComponent<BoostSystem>() ?? gameObject.AddComponent<BoostSystem>();
            trickSystem = GetComponent<TrickSystem>() ?? gameObject.AddComponent<TrickSystem>();

            fuelSystem.Initialize(stats.fuelCapacity, stats.fuelConsumption);
            boostSystem.Initialize();
            trickSystem.Initialize(this);
        }

        void FixedUpdate()
        {
            if (isCrashed || GameManager.Instance.currentState != GameState.Playing)
                return;

            UpdateGroundedState();
            HandleMovement();
            HandleAirControl();
            UpdateState();
        }

        void Update()
        {
            if (isCrashed) return;

            // Track distance
            float distance = Mathf.Abs(rb.velocity.x) * Time.deltaTime;
            GameManager.Instance?.AddDistance(distance);
        }

        private void UpdateGroundedState()
        {
            bool frontGrounded = frontWheel != null && frontWheel.isGrounded;
            bool rearGrounded = rearWheel != null && rearWheel.isGrounded;
            isGrounded = frontGrounded || rearGrounded;

            if (isGrounded)
            {
                if (airTime > 0.1f)
                {
                    trickSystem?.OnLanded(airTime, rotationAngle);
                }
                airTime = 0f;
                lastGroundedTime = Time.time;
            }
            else
            {
                airTime += Time.fixedDeltaTime;
            }
        }

        private void HandleMovement()
        {
            if (input == null) return;

            // Fuel check
            if (fuelSystem != null && fuelSystem.IsEmpty())
            {
                // Out of fuel - coast to stop
                return;
            }

            // Calculate power with boost multiplier
            float power = stats.enginePower;
            if (boostSystem != null && boostSystem.IsBoosting)
            {
                power *= boostSystem.powerMultiplier;
            }

            // Apply throttle
            if (input.throttle > 0.1f)
            {
                float torque = power * input.throttle;

                if (rearWheel != null)
                {
                    rearWheel.ApplyMotorTorque(torque);
                }
                if (frontWheel != null && isGrounded)
                {
                    frontWheel.ApplyMotorTorque(torque * 0.3f); // Less power to front
                }

                // Consume fuel
                fuelSystem?.ConsumeFuel(stats.fuelConsumption * Time.fixedDeltaTime);
            }

            // Apply brake
            if (input.brake > 0.1f)
            {
                float brakeTorque = power * 0.5f * input.brake;

                if (rearWheel != null)
                {
                    rearWheel.ApplyBrakeTorque(brakeTorque);
                }
                if (frontWheel != null)
                {
                    frontWheel.ApplyBrakeTorque(brakeTorque);
                }
            }
        }

        private void HandleAirControl()
        {
            if (isGrounded || input == null) return;

            // Allow rotation in air
            float airTorque = 500f * stats.mass / 500f;

            if (input.tilt != 0)
            {
                rb.AddTorque(input.tilt * airTorque);
            }

            // Stabilization
            float currentRotation = rb.rotation;
            if (Mathf.Abs(currentRotation) > 60 && input.tilt == 0)
            {
                // Light auto-stabilization when not actively controlling
                float stabilization = -Mathf.Sign(currentRotation) * 50f;
                rb.AddTorque(stabilization);
            }
        }

        private void UpdateState()
        {
            currentSpeed = rb.velocity.magnitude;
            rotationAngle = rb.rotation;

            // Check for crash (upside down and touching ground)
            if (isGrounded && Mathf.Abs(rotationAngle) > 90f)
            {
                Crash();
            }

            // Check for head crash (body touches ground)
            // This is handled by collision detection
        }

        public void Crash()
        {
            if (isCrashed) return;

            isCrashed = true;
            Debug.Log("Vehicle crashed!");

            // Disable motor
            if (frontWheel != null) frontWheel.ApplyMotorTorque(0);
            if (rearWheel != null) rearWheel.ApplyMotorTorque(0);

            // Trigger game over
            GameManager.Instance?.ChangeState(GameState.GameOver);
        }

        public void Initialize(VehicleStats vehicleStats)
        {
            stats = vehicleStats;
            rb.mass = stats.mass;

            if (fuelSystem != null)
            {
                fuelSystem.Initialize(stats.fuelCapacity, stats.fuelConsumption);
            }
        }

        public void Reset()
        {
            isCrashed = false;
            airTime = 0f;
            rb.velocity = Vector2.zero;
            rb.angularVelocity = 0f;
            rb.rotation = 0f;
            transform.rotation = Quaternion.identity;

            fuelSystem?.Refuel();
            boostSystem?.Reset();
            trickSystem?.Reset();
        }

        public void AddFuel(float amount)
        {
            fuelSystem?.AddFuel(amount);
        }

        public void CollectCoin(int value)
        {
            GameManager.Instance?.AddCoins(value);
        }

        void OnCollisionEnter2D(Collision2D collision)
        {
            // Check for head/body collision with ground (not wheels)
            if (collision.gameObject.CompareTag("Ground"))
            {
                foreach (ContactPoint2D contact in collision.contacts)
                {
                    // If collision point is on vehicle body (not wheels)
                    if (vehicleBody != null)
                    {
                        float distToBody = Vector2.Distance(contact.point, vehicleBody.position);
                        float distToFront = frontWheel != null ? Vector2.Distance(contact.point, frontWheel.transform.position) : float.MaxValue;
                        float distToRear = rearWheel != null ? Vector2.Distance(contact.point, rearWheel.transform.position) : float.MaxValue;

                        if (distToBody < distToFront && distToBody < distToRear)
                        {
                            Crash();
                            break;
                        }
                    }
                }
            }
        }
    }
}
