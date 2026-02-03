using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using SummitWheels.Core;
using SummitWheels.Data;

namespace SummitWheels.UI
{
    public class GarageUI : MonoBehaviour
    {
        [Header("Vehicle Display")]
        public Image vehiclePreviewImage;
        public TextMeshProUGUI vehicleNameText;
        public TextMeshProUGUI vehicleDescriptionText;
        public TextMeshProUGUI vehicleCostText;
        public GameObject[] starObjects;

        [Header("Stats Display")]
        public Slider engineSlider;
        public Slider tiresSlider;
        public Slider suspensionSlider;
        public Slider fuelSlider;
        public TextMeshProUGUI engineLevelText;
        public TextMeshProUGUI tiresLevelText;
        public TextMeshProUGUI suspensionLevelText;
        public TextMeshProUGUI fuelLevelText;

        [Header("Upgrade Buttons")]
        public Button upgradeEngineButton;
        public Button upgradeTiresButton;
        public Button upgradeSuspensionButton;
        public Button upgradeFuelButton;
        public TextMeshProUGUI engineCostText;
        public TextMeshProUGUI tiresCostText;
        public TextMeshProUGUI suspensionCostText;
        public TextMeshProUGUI fuelCostText;

        [Header("Vehicle Selection")]
        public Transform vehicleListContainer;
        public GameObject vehicleItemPrefab;
        public Button selectButton;
        public Button purchaseButton;

        [Header("Navigation")]
        public Button backButton;
        public TextMeshProUGUI coinsText;

        private GameManager gameManager;
        private VehicleData currentVehicle;
        private List<VehicleData> vehicles;
        private int currentIndex;

        void Start()
        {
            gameManager = GameManager.Instance;

            if (backButton != null)
            {
                backButton.onClick.AddListener(OnBackClicked);
            }

            if (selectButton != null)
            {
                selectButton.onClick.AddListener(OnSelectClicked);
            }

            if (purchaseButton != null)
            {
                purchaseButton.onClick.AddListener(OnPurchaseClicked);
            }

            // Setup upgrade buttons
            if (upgradeEngineButton != null)
                upgradeEngineButton.onClick.AddListener(() => OnUpgradeClicked(UpgradeType.Engine));
            if (upgradeTiresButton != null)
                upgradeTiresButton.onClick.AddListener(() => OnUpgradeClicked(UpgradeType.Tires));
            if (upgradeSuspensionButton != null)
                upgradeSuspensionButton.onClick.AddListener(() => OnUpgradeClicked(UpgradeType.Suspension));
            if (upgradeFuelButton != null)
                upgradeFuelButton.onClick.AddListener(() => OnUpgradeClicked(UpgradeType.FuelTank));

            LoadVehicles();
        }

        void OnEnable()
        {
            if (gameManager != null)
            {
                LoadVehicles();
            }
        }

        private void LoadVehicles()
        {
            if (gameManager?.vehicleDatabase == null) return;

            vehicles = new List<VehicleData>(gameManager.vehicleDatabase.vehicles);

            // Find current selected vehicle index
            currentIndex = 0;
            if (gameManager.selectedVehicle != null)
            {
                for (int i = 0; i < vehicles.Count; i++)
                {
                    if (vehicles[i].id == gameManager.selectedVehicle.id)
                    {
                        currentIndex = i;
                        break;
                    }
                }
            }

            ShowVehicle(currentIndex);
            UpdateCoins();
        }

        public void ShowVehicle(int index)
        {
            if (vehicles == null || index < 0 || index >= vehicles.Count) return;

            currentIndex = index;
            currentVehicle = vehicles[index];

            // Update display
            if (vehicleNameText != null)
                vehicleNameText.text = currentVehicle.vehicleName;

            if (vehicleDescriptionText != null)
                vehicleDescriptionText.text = currentVehicle.description;

            if (vehiclePreviewImage != null && currentVehicle.icon != null)
                vehiclePreviewImage.sprite = currentVehicle.icon;

            // Update stars
            if (starObjects != null)
            {
                for (int i = 0; i < starObjects.Length; i++)
                {
                    starObjects[i].SetActive(i < currentVehicle.starRating);
                }
            }

            // Check ownership
            bool isOwned = gameManager.GetProgress().unlockedVehicles.Contains(currentVehicle.id);
            bool isSelected = gameManager.selectedVehicle?.id == currentVehicle.id;

            if (selectButton != null)
            {
                selectButton.gameObject.SetActive(isOwned && !isSelected);
            }

            if (purchaseButton != null)
            {
                purchaseButton.gameObject.SetActive(!isOwned);
            }

            if (vehicleCostText != null)
            {
                vehicleCostText.text = isOwned ? "OWNED" : $"{currentVehicle.unlockCost:N0}";
                vehicleCostText.gameObject.SetActive(!isOwned);
            }

            // Update upgrade display
            UpdateUpgradeDisplay();
        }

        private void UpdateUpgradeDisplay()
        {
            if (currentVehicle == null || gameManager == null) return;

            var progress = gameManager.GetProgress();
            UpgradeLevels upgrades = new UpgradeLevels();
            if (progress.vehicleUpgrades.TryGetValue(currentVehicle.id, out var existing))
            {
                upgrades = existing;
            }

            bool isOwned = progress.unlockedVehicles.Contains(currentVehicle.id);

            // Engine
            UpdateUpgradeSlot(engineSlider, engineLevelText, upgradeEngineButton, engineCostText,
                upgrades.engine, upgrades.GetUpgradeCost(UpgradeType.Engine), isOwned);

            // Tires
            UpdateUpgradeSlot(tiresSlider, tiresLevelText, upgradeTiresButton, tiresCostText,
                upgrades.tires, upgrades.GetUpgradeCost(UpgradeType.Tires), isOwned);

            // Suspension
            UpdateUpgradeSlot(suspensionSlider, suspensionLevelText, upgradeSuspensionButton, suspensionCostText,
                upgrades.suspension, upgrades.GetUpgradeCost(UpgradeType.Suspension), isOwned);

            // Fuel
            UpdateUpgradeSlot(fuelSlider, fuelLevelText, upgradeFuelButton, fuelCostText,
                upgrades.fuelTank, upgrades.GetUpgradeCost(UpgradeType.FuelTank), isOwned);
        }

        private void UpdateUpgradeSlot(Slider slider, TextMeshProUGUI levelText, Button button, TextMeshProUGUI costText, int level, float cost, bool isOwned)
        {
            if (slider != null)
                slider.value = level / (float)UpgradeLevels.MAX_LEVEL;

            if (levelText != null)
                levelText.text = $"Lv.{level}";

            if (button != null)
            {
                bool maxed = level >= UpgradeLevels.MAX_LEVEL;
                bool canAfford = gameManager.GetCoins() >= cost;
                button.interactable = isOwned && !maxed && canAfford;
            }

            if (costText != null)
            {
                if (level >= UpgradeLevels.MAX_LEVEL)
                    costText.text = "MAX";
                else
                    costText.text = $"{cost:N0}";
            }
        }

        private void UpdateCoins()
        {
            if (coinsText != null && gameManager != null)
            {
                coinsText.text = gameManager.GetCoins().ToString("N0");
            }
        }

        public void NextVehicle()
        {
            ShowVehicle((currentIndex + 1) % vehicles.Count);
        }

        public void PreviousVehicle()
        {
            ShowVehicle((currentIndex - 1 + vehicles.Count) % vehicles.Count);
        }

        private void OnSelectClicked()
        {
            if (currentVehicle != null && gameManager != null)
            {
                gameManager.SelectVehicle(currentVehicle);
                ShowVehicle(currentIndex); // Refresh UI
            }
        }

        private void OnPurchaseClicked()
        {
            if (currentVehicle != null && gameManager != null)
            {
                if (gameManager.PurchaseVehicle(currentVehicle.id))
                {
                    ShowVehicle(currentIndex);
                    UpdateCoins();
                }
            }
        }

        private void OnUpgradeClicked(UpgradeType type)
        {
            if (currentVehicle != null && gameManager != null)
            {
                if (gameManager.PurchaseUpgrade(currentVehicle.id, type))
                {
                    UpdateUpgradeDisplay();
                    UpdateCoins();
                }
            }
        }

        private void OnBackClicked()
        {
            if (gameManager != null)
            {
                gameManager.ChangeState(GameState.MainMenu);
            }
        }
    }
}
