using UnityEngine;
using UnityEngine.Events;

namespace SummitWheels.Core
{
    public class InputManager : MonoBehaviour
    {
        public static InputManager Instance { get; private set; }

        [Header("Input Values")]
        public float throttle;  // 0 to 1
        public float brake;     // 0 to 1
        public float tilt;      // -1 to 1 (for vehicle rotation in air)
        public bool boostPressed;
        public bool pausePressed;

        [Header("Settings")]
        public float touchSensitivity = 1f;
        public bool invertControls = false;
        public bool useAccelerometer = false;

        // Events
        public UnityEvent OnBoostActivated;
        public UnityEvent OnPausePressed;

        private bool leftTouched;
        private bool rightTouched;

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

        void Update()
        {
            HandleTouchInput();
            HandleKeyboardInput();
            HandleAccelerometerInput();
        }

        private void HandleTouchInput()
        {
            leftTouched = false;
            rightTouched = false;

            foreach (Touch touch in Input.touches)
            {
                if (touch.phase == TouchPhase.Began || touch.phase == TouchPhase.Stationary || touch.phase == TouchPhase.Moved)
                {
                    if (touch.position.x < Screen.width / 2)
                    {
                        leftTouched = true;
                    }
                    else
                    {
                        rightTouched = true;
                    }
                }
            }

            if (Application.platform == RuntimePlatform.Android || Application.platform == RuntimePlatform.IPhonePlayer)
            {
                if (invertControls)
                {
                    throttle = leftTouched ? 1f : 0f;
                    brake = rightTouched ? 1f : 0f;
                }
                else
                {
                    throttle = rightTouched ? 1f : 0f;
                    brake = leftTouched ? 1f : 0f;
                }
            }
        }

        private void HandleKeyboardInput()
        {
            // Keyboard overrides touch input (for editor testing)
            if (Application.platform == RuntimePlatform.WindowsEditor ||
                Application.platform == RuntimePlatform.OSXEditor ||
                Application.platform == RuntimePlatform.LinuxEditor ||
                Application.platform == RuntimePlatform.WindowsPlayer)
            {
                // Gas/Brake
                if (Input.GetKey(KeyCode.RightArrow) || Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.W))
                {
                    throttle = 1f;
                }
                else
                {
                    throttle = Mathf.MoveTowards(throttle, 0f, Time.deltaTime * 5f);
                }

                if (Input.GetKey(KeyCode.LeftArrow) || Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.S))
                {
                    brake = 1f;
                }
                else
                {
                    brake = Mathf.MoveTowards(brake, 0f, Time.deltaTime * 5f);
                }

                // Tilt (for air control)
                tilt = 0f;
                if (Input.GetKey(KeyCode.UpArrow))
                {
                    tilt = -1f;  // Tilt forward (nose down)
                }
                if (Input.GetKey(KeyCode.DownArrow))
                {
                    tilt = 1f;   // Tilt backward (nose up)
                }

                // Boost
                if (Input.GetKeyDown(KeyCode.Space))
                {
                    boostPressed = true;
                    OnBoostActivated?.Invoke();
                }
                else
                {
                    boostPressed = Input.GetKey(KeyCode.Space);
                }

                // Pause
                if (Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.P))
                {
                    pausePressed = true;
                    OnPausePressed?.Invoke();
                }
                else
                {
                    pausePressed = false;
                }
            }
        }

        private void HandleAccelerometerInput()
        {
            if (!useAccelerometer) return;

            // Use accelerometer for tilt control
            Vector3 accel = Input.acceleration;
            tilt = Mathf.Clamp(accel.x * touchSensitivity, -1f, 1f);
        }

        public void SetThrottle(float value)
        {
            throttle = Mathf.Clamp01(value);
        }

        public void SetBrake(float value)
        {
            brake = Mathf.Clamp01(value);
        }

        public void TriggerBoost()
        {
            boostPressed = true;
            OnBoostActivated?.Invoke();
        }

        public void TriggerPause()
        {
            pausePressed = true;
            OnPausePressed?.Invoke();
        }
    }
}
