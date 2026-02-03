using UnityEngine;
using UnityEngine.UI;
using TMPro;
using SummitWheels.Core;
using SummitWheels.Systems;

namespace SummitWheels.UI
{
    public class HUDController : MonoBehaviour
    {
        [Header("Distance")]
        public TextMeshProUGUI distanceText;
        public string distanceFormat = "{0:N0}m";

        [Header("Coins")]
        public TextMeshProUGUI coinsText;
        public string coinsFormat = "{0:N0}";

        [Header("Fuel")]
        public Slider fuelSlider;
        public Image fuelFillImage;
        public Color fuelNormalColor = Color.green;
        public Color fuelLowColor = Color.red;
        public float fuelWarningThreshold = 0.25f;

        [Header("Boost")]
        public Slider boostSlider;
        public Image boostFillImage;
        public Color boostReadyColor = Color.cyan;
        public Color boostActiveColor = Color.yellow;
        public Color boostCooldownColor = Color.gray;

        [Header("Combo")]
        public GameObject comboPanel;
        public TextMeshProUGUI comboCountText;
        public TextMeshProUGUI comboMultiplierText;
        public Slider comboTimerSlider;
        public TextMeshProUGUI comboTierText;

        [Header("Tricks")]
        public TextMeshProUGUI trickPopupText;
        public Animator trickAnimator;
        private float trickPopupTimer;

        [Header("Ghost")]
        public TextMeshProUGUI ghostDeltaText;
        public Color aheadColor = Color.green;
        public Color behindColor = Color.red;

        [Header("Pause Button")]
        public Button pauseButton;

        private GameManager gameManager;
        private FuelSystem fuelSystem;
        private BoostSystem boostSystem;
        private ComboSystem comboSystem;
        private TrickSystem trickSystem;
        private GhostSystem ghostSystem;

        void Start()
        {
            gameManager = GameManager.Instance;

            if (gameManager != null)
            {
                gameManager.OnDistanceChanged += UpdateDistance;
                gameManager.OnCoinsChanged += UpdateCoins;
            }

            if (pauseButton != null)
            {
                pauseButton.onClick.AddListener(OnPauseClicked);
            }

            // Hide combo panel initially
            if (comboPanel != null)
            {
                comboPanel.SetActive(false);
            }
        }

        void OnDestroy()
        {
            if (gameManager != null)
            {
                gameManager.OnDistanceChanged -= UpdateDistance;
                gameManager.OnCoinsChanged -= UpdateCoins;
            }

            UnsubscribeSystems();
        }

        public void Initialize(FuelSystem fuel, BoostSystem boost, ComboSystem combo, TrickSystem trick, GhostSystem ghost = null)
        {
            UnsubscribeSystems();

            fuelSystem = fuel;
            boostSystem = boost;
            comboSystem = combo;
            trickSystem = trick;
            ghostSystem = ghost;

            if (fuelSystem != null)
            {
                fuelSystem.OnFuelChanged += UpdateFuel;
            }

            if (boostSystem != null)
            {
                boostSystem.OnBoostChanged += UpdateBoost;
                boostSystem.OnBoostActivated += OnBoostActivated;
                boostSystem.OnBoostDeactivated += OnBoostDeactivated;
            }

            if (comboSystem != null)
            {
                comboSystem.OnComboUpdated += UpdateCombo;
                comboSystem.OnTierReached += OnTierReached;
                comboSystem.OnComboEnded += OnComboEnded;
            }

            if (trickSystem != null)
            {
                trickSystem.OnTrickCompleted += ShowTrickPopup;
            }
        }

        private void UnsubscribeSystems()
        {
            if (fuelSystem != null)
            {
                fuelSystem.OnFuelChanged -= UpdateFuel;
            }

            if (boostSystem != null)
            {
                boostSystem.OnBoostChanged -= UpdateBoost;
                boostSystem.OnBoostActivated -= OnBoostActivated;
                boostSystem.OnBoostDeactivated -= OnBoostDeactivated;
            }

            if (comboSystem != null)
            {
                comboSystem.OnComboUpdated -= UpdateCombo;
                comboSystem.OnTierReached -= OnTierReached;
                comboSystem.OnComboEnded -= OnComboEnded;
            }

            if (trickSystem != null)
            {
                trickSystem.OnTrickCompleted -= ShowTrickPopup;
            }
        }

        void Update()
        {
            // Update combo timer
            if (comboSystem != null && comboPanel != null && comboPanel.activeSelf)
            {
                if (comboTimerSlider != null)
                {
                    comboTimerSlider.value = comboSystem.GetTimeRemainingPercent();
                }
            }

            // Update ghost delta
            if (ghostSystem != null && ghostDeltaText != null)
            {
                float delta = ghostSystem.GetTimeDelta();
                if (Mathf.Abs(delta) > 0.01f)
                {
                    string sign = delta > 0 ? "+" : "";
                    ghostDeltaText.text = $"{sign}{delta:F1}s";
                    ghostDeltaText.color = delta > 0 ? behindColor : aheadColor;
                    ghostDeltaText.gameObject.SetActive(true);
                }
                else
                {
                    ghostDeltaText.gameObject.SetActive(false);
                }
            }

            // Trick popup timer
            if (trickPopupTimer > 0)
            {
                trickPopupTimer -= Time.deltaTime;
                if (trickPopupTimer <= 0 && trickPopupText != null)
                {
                    trickPopupText.gameObject.SetActive(false);
                }
            }
        }

        private void UpdateDistance(float distance)
        {
            if (distanceText != null)
            {
                distanceText.text = string.Format(distanceFormat, distance);
            }
        }

        private void UpdateCoins(int coins)
        {
            if (coinsText != null)
            {
                coinsText.text = string.Format(coinsFormat, coins);
            }
        }

        private void UpdateFuel(float current, float max)
        {
            if (fuelSlider != null)
            {
                fuelSlider.value = current / max;
            }

            if (fuelFillImage != null)
            {
                float percent = current / max;
                fuelFillImage.color = percent <= fuelWarningThreshold ? fuelLowColor : fuelNormalColor;
            }
        }

        private void UpdateBoost(float current, float max)
        {
            if (boostSlider != null)
            {
                boostSlider.value = current / max;
            }
        }

        private void OnBoostActivated()
        {
            if (boostFillImage != null)
            {
                boostFillImage.color = boostActiveColor;
            }
        }

        private void OnBoostDeactivated()
        {
            if (boostFillImage != null)
            {
                boostFillImage.color = boostSystem.IsOnCooldown ? boostCooldownColor : boostReadyColor;
            }
        }

        private void UpdateCombo(int count, float multiplier)
        {
            if (comboPanel != null)
            {
                comboPanel.SetActive(count > 0);
            }

            if (comboCountText != null)
            {
                comboCountText.text = $"{count}x";
            }

            if (comboMultiplierText != null)
            {
                comboMultiplierText.text = $"x{multiplier:F1}";
            }
        }

        private void OnTierReached(ComboTier tier, int reward)
        {
            if (comboTierText != null)
            {
                comboTierText.text = $"{tier}! +{reward}";
                // Could trigger animation here
            }
        }

        private void OnComboEnded(int totalPoints)
        {
            if (comboPanel != null)
            {
                comboPanel.SetActive(false);
            }
        }

        private void ShowTrickPopup(TrickType trick, int points)
        {
            if (trickPopupText != null)
            {
                trickPopupText.text = $"{trick}\n+{points}";
                trickPopupText.gameObject.SetActive(true);
                trickPopupTimer = 1.5f;

                if (trickAnimator != null)
                {
                    trickAnimator.SetTrigger("Pop");
                }
            }
        }

        private void OnPauseClicked()
        {
            if (gameManager != null && gameManager.currentState == GameState.Playing)
            {
                gameManager.ChangeState(GameState.Paused);
            }
        }
    }
}
