using UnityEngine;

namespace SummitWheels.Vehicle
{
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(CircleCollider2D))]
    public class WheelController : MonoBehaviour
    {
        [Header("Components")]
        public Rigidbody2D rb;
        public CircleCollider2D wheelCollider;
        public WheelJoint2D wheelJoint;

        [Header("Settings")]
        public float friction = 0.8f;
        public float maxMotorTorque = 1000f;
        public bool isPowered = true;

        [Header("State")]
        public bool isGrounded;
        public float angularVelocity;
        public float rpm;

        private int groundContactCount;

        void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            wheelCollider = GetComponent<CircleCollider2D>();
            wheelJoint = GetComponent<WheelJoint2D>();
        }

        void FixedUpdate()
        {
            angularVelocity = rb.angularVelocity;
            rpm = angularVelocity * 60f / (2f * Mathf.PI);
        }

        public void ApplyMotorTorque(float torque)
        {
            if (!isPowered) return;

            float clampedTorque = Mathf.Clamp(torque, -maxMotorTorque, maxMotorTorque);

            if (wheelJoint != null && wheelJoint.useMotor)
            {
                JointMotor2D motor = wheelJoint.motor;
                motor.motorSpeed = clampedTorque > 0 ? -1000f : (clampedTorque < 0 ? 1000f : 0f);
                motor.maxMotorTorque = Mathf.Abs(clampedTorque);
                wheelJoint.motor = motor;
            }
            else
            {
                // Fallback: apply torque directly
                rb.AddTorque(-clampedTorque * Time.fixedDeltaTime);
            }
        }

        public void ApplyBrakeTorque(float torque)
        {
            // Slow down wheel rotation
            float brakingForce = Mathf.Sign(angularVelocity) * torque * Time.fixedDeltaTime;
            rb.angularVelocity -= brakingForce;

            // Clamp to prevent reversing
            if (Mathf.Sign(rb.angularVelocity) != Mathf.Sign(angularVelocity))
            {
                rb.angularVelocity = 0f;
            }
        }

        public void SetFriction(float newFriction)
        {
            friction = newFriction;

            if (wheelCollider != null && wheelCollider.sharedMaterial != null)
            {
                PhysicsMaterial2D mat = new PhysicsMaterial2D();
                mat.friction = friction;
                mat.bounciness = 0.1f;
                wheelCollider.sharedMaterial = mat;
            }
        }

        void OnCollisionEnter2D(Collision2D collision)
        {
            if (collision.gameObject.CompareTag("Ground"))
            {
                groundContactCount++;
                isGrounded = true;
            }
        }

        void OnCollisionExit2D(Collision2D collision)
        {
            if (collision.gameObject.CompareTag("Ground"))
            {
                groundContactCount--;
                isGrounded = groundContactCount > 0;
            }
        }

        void OnCollisionStay2D(Collision2D collision)
        {
            if (collision.gameObject.CompareTag("Ground"))
            {
                isGrounded = true;
            }
        }
    }
}
