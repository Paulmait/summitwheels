using UnityEngine;
using UnityEngine.UI;
using TMPro;
using SummitWheels.Core;

namespace SummitWheels.UI
{
    public class MainMenuUI : MonoBehaviour
    {
        [Header("Buttons")]
        public Button playButton;
        public Button garageButton;
        public Button stageSelectButton;
        public Button shopButton;
        public Button leaderboardButton;
        public Button dailyChallengeButton;
        public Button settingsButton;

        [Header("Display")]
        public TextMeshProUGUI coinsText;
        public TextMeshProUGUI bestDistanceText;
        public TextMeshProUGUI selectedVehicleText;
        public TextMeshProUGUI selectedStageText;

        [Header("Daily Reward")]
        public GameObject dailyRewardBadge;
        public TextMeshProUGUI streakText;

        private GameManager gameManager;

        void Start()
        {
            gameManager = GameManager.Instance;

            // Setup button listeners
            if (playButton != null)
            {
                playButton.onClick.AddListener(OnPlayClicked);
            }

            if (garageButton != null)
            {
                garageButton.onClick.AddListener(OnGarageClicked);
            }

            if (stageSelectButton != null)
            {
                stageSelectButton.onClick.AddListener(OnStageSelectClicked);
            }

            if (shopButton != null)
            {
                shopButton.onClick.AddListener(OnShopClicked);
            }

            if (leaderboardButton != null)
            {
                leaderboardButton.onClick.AddListener(OnLeaderboardClicked);
            }

            if (dailyChallengeButton != null)
            {
                dailyChallengeButton.onClick.AddListener(OnDailyChallengeClicked);
            }

            if (settingsButton != null)
            {
                settingsButton.onClick.AddListener(OnSettingsClicked);
            }

            UpdateUI();
        }

        void OnEnable()
        {
            UpdateUI();
        }

        public void UpdateUI()
        {
            if (gameManager == null) return;

            var progress = gameManager.GetProgress();
            if (progress == null) return;

            // Update coins
            if (coinsText != null)
            {
                coinsText.text = progress.coins.ToString("N0");
            }

            // Update best distance
            if (bestDistanceText != null)
            {
                bestDistanceText.text = $"Best: {progress.bestDistance:N0}m";
            }

            // Update selected vehicle
            if (selectedVehicleText != null && gameManager.selectedVehicle != null)
            {
                selectedVehicleText.text = gameManager.selectedVehicle.vehicleName;
            }

            // Update selected stage
            if (selectedStageText != null && gameManager.selectedStage != null)
            {
                selectedStageText.text = gameManager.selectedStage.stageName;
            }

            // Update daily streak
            if (streakText != null)
            {
                streakText.text = $"{progress.dailyStreak} day streak";
            }

            // Show daily reward badge if available
            if (dailyRewardBadge != null)
            {
                string today = System.DateTime.Now.ToString("yyyy-MM-dd");
                bool canClaimDaily = progress.lastLoginDate != today;
                dailyRewardBadge.SetActive(canClaimDaily);
            }
        }

        private void OnPlayClicked()
        {
            if (gameManager != null)
            {
                gameManager.StartRun();
            }
        }

        private void OnGarageClicked()
        {
            if (gameManager != null)
            {
                gameManager.ChangeState(GameState.Garage);
            }
        }

        private void OnStageSelectClicked()
        {
            if (gameManager != null)
            {
                gameManager.ChangeState(GameState.StageSelect);
            }
        }

        private void OnShopClicked()
        {
            if (gameManager != null)
            {
                gameManager.ChangeState(GameState.Shop);
            }
        }

        private void OnLeaderboardClicked()
        {
            if (gameManager != null)
            {
                gameManager.ChangeState(GameState.Leaderboard);
            }
        }

        private void OnDailyChallengeClicked()
        {
            if (gameManager != null)
            {
                gameManager.ChangeState(GameState.DailyChallenge);
            }
        }

        private void OnSettingsClicked()
        {
            if (gameManager != null)
            {
                gameManager.ChangeState(GameState.Settings);
            }
        }
    }
}
