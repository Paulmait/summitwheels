using UnityEngine;
using UnityEngine.UI;
using TMPro;
using SummitWheels.Core;

namespace SummitWheels.UI
{
    public class ResultsUI : MonoBehaviour
    {
        [Header("Stats")]
        public TextMeshProUGUI distanceText;
        public TextMeshProUGUI coinsText;
        public TextMeshProUGUI tricksText;
        public TextMeshProUGUI comboText;
        public TextMeshProUGUI airtimeText;

        [Header("Best Records")]
        public TextMeshProUGUI bestDistanceText;
        public GameObject newRecordBadge;

        [Header("Rewards")]
        public TextMeshProUGUI totalRewardText;

        [Header("Buttons")]
        public Button retryButton;
        public Button menuButton;
        public Button doubleRewardButton;

        [Header("Animation")]
        public Animator animator;
        public float statAnimationDelay = 0.2f;

        private GameManager gameManager;
        private bool isNewRecord;

        void Start()
        {
            gameManager = GameManager.Instance;

            if (retryButton != null)
            {
                retryButton.onClick.AddListener(OnRetryClicked);
            }

            if (menuButton != null)
            {
                menuButton.onClick.AddListener(OnMenuClicked);
            }

            if (doubleRewardButton != null)
            {
                doubleRewardButton.onClick.AddListener(OnDoubleRewardClicked);
            }
        }

        void OnEnable()
        {
            ShowResults();
        }

        public void ShowResults()
        {
            if (gameManager == null) return;

            var progress = gameManager.GetProgress();

            // Check for new record
            isNewRecord = gameManager.currentDistance >= progress.bestDistance &&
                          gameManager.currentDistance == progress.bestDistance;

            // Animate stats
            StartCoroutine(AnimateStats());
        }

        private System.Collections.IEnumerator AnimateStats()
        {
            // Distance
            if (distanceText != null)
            {
                yield return AnimateNumber(distanceText, 0, gameManager.currentDistance, "N0", "m");
            }

            yield return new WaitForSeconds(statAnimationDelay);

            // Coins
            if (coinsText != null)
            {
                yield return AnimateNumber(coinsText, 0, gameManager.currentCoins, "N0", "");
            }

            yield return new WaitForSeconds(statAnimationDelay);

            // Tricks
            if (tricksText != null)
            {
                tricksText.text = gameManager.currentTricks.ToString();
            }

            yield return new WaitForSeconds(statAnimationDelay);

            // Combo
            if (comboText != null)
            {
                comboText.text = $"{gameManager.currentCombo}x";
            }

            yield return new WaitForSeconds(statAnimationDelay);

            // Airtime
            if (airtimeText != null)
            {
                airtimeText.text = $"{gameManager.currentAirtime:F1}s";
            }

            // Best distance
            if (bestDistanceText != null)
            {
                var progress = gameManager.GetProgress();
                bestDistanceText.text = $"Best: {progress.bestDistance:N0}m";
            }

            // New record badge
            if (newRecordBadge != null)
            {
                newRecordBadge.SetActive(isNewRecord);
            }

            // Total reward
            if (totalRewardText != null)
            {
                totalRewardText.text = $"+{gameManager.currentCoins:N0}";
            }
        }

        private System.Collections.IEnumerator AnimateNumber(TextMeshProUGUI text, float from, float to, string format, string suffix)
        {
            float duration = 1f;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                t = t * t * (3f - 2f * t); // Smooth step

                float value = Mathf.Lerp(from, to, t);
                text.text = value.ToString(format) + suffix;

                yield return null;
            }

            text.text = to.ToString(format) + suffix;
        }

        private void OnRetryClicked()
        {
            if (gameManager != null)
            {
                gameManager.StartRun();
            }
        }

        private void OnMenuClicked()
        {
            if (gameManager != null)
            {
                gameManager.ChangeState(GameState.MainMenu);
            }
        }

        private void OnDoubleRewardClicked()
        {
            // This would trigger a rewarded ad
            // On success, double the coins
            int bonusCoins = gameManager.currentCoins;
            gameManager.GetComponent<SaveManager>()?.AddCoins(bonusCoins, "Rewarded Ad Bonus");

            // Disable button after use
            if (doubleRewardButton != null)
            {
                doubleRewardButton.interactable = false;
            }

            // Update display
            if (totalRewardText != null)
            {
                totalRewardText.text = $"+{gameManager.currentCoins * 2:N0}";
            }

            Debug.Log($"Double reward claimed: +{bonusCoins} coins");
        }
    }
}
