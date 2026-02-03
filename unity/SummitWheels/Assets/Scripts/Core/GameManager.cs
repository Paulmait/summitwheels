using UnityEngine;
using SummitWheels.Data;
using SummitWheels.Systems;

namespace SummitWheels.Core
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("State")]
        public GameState currentState = GameState.MainMenu;
        public bool isPaused = false;

        [Header("Current Session")]
        public VehicleData selectedVehicle;
        public StageData selectedStage;
        public float currentDistance;
        public int currentCoins;
        public int currentTricks;
        public float currentAirtime;
        public int currentCombo;

        [Header("References")]
        public VehicleDatabase vehicleDatabase;
        public StageDatabase stageDatabase;
        public AchievementDatabase achievementDatabase;

        // Events
        public System.Action<GameState> OnStateChanged;
        public System.Action<float> OnDistanceChanged;
        public System.Action<int> OnCoinsChanged;
        public System.Action OnGameOver;

        private SaveManager saveManager;

        void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                Initialize();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        void Initialize()
        {
            saveManager = GetComponent<SaveManager>();
            if (saveManager == null)
            {
                saveManager = gameObject.AddComponent<SaveManager>();
            }

            saveManager.Load();

            // Set default selections
            if (selectedVehicle == null && vehicleDatabase != null)
            {
                selectedVehicle = vehicleDatabase.GetVehicle(saveManager.Progress.selectedVehicle);
                if (selectedVehicle == null)
                {
                    selectedVehicle = vehicleDatabase.GetDefaultVehicle();
                }
            }

            if (selectedStage == null && stageDatabase != null)
            {
                selectedStage = stageDatabase.GetStage(saveManager.Progress.selectedStage);
                if (selectedStage == null)
                {
                    selectedStage = stageDatabase.GetDefaultStage();
                }
            }
        }

        public void ChangeState(GameState newState)
        {
            currentState = newState;
            OnStateChanged?.Invoke(newState);

            switch (newState)
            {
                case GameState.MainMenu:
                    Time.timeScale = 1f;
                    break;
                case GameState.Playing:
                    Time.timeScale = 1f;
                    isPaused = false;
                    break;
                case GameState.Paused:
                    Time.timeScale = 0f;
                    isPaused = true;
                    break;
                case GameState.GameOver:
                    Time.timeScale = 1f;
                    EndRun();
                    break;
            }
        }

        public void StartRun()
        {
            currentDistance = 0f;
            currentCoins = 0;
            currentTricks = 0;
            currentAirtime = 0f;
            currentCombo = 0;
            ChangeState(GameState.Playing);
        }

        public void EndRun()
        {
            // Update progress
            saveManager.Progress.totalRuns++;
            saveManager.Progress.totalCoins += currentCoins;
            saveManager.Progress.totalTricks += currentTricks;
            saveManager.Progress.totalAirTime += currentAirtime;

            if (currentDistance > saveManager.Progress.bestDistance)
            {
                saveManager.Progress.bestDistance = currentDistance;
            }

            if (currentCombo > saveManager.Progress.highestCombo)
            {
                saveManager.Progress.highestCombo = currentCombo;
            }

            // Add coins to balance
            saveManager.Progress.coins += currentCoins;

            saveManager.Save();
            OnGameOver?.Invoke();
        }

        public void AddDistance(float distance)
        {
            currentDistance += distance;
            OnDistanceChanged?.Invoke(currentDistance);
        }

        public void AddCoins(int amount)
        {
            // Apply stage multiplier
            float multiplier = selectedStage != null ? selectedStage.coinMultiplier : 1f;
            int finalAmount = Mathf.RoundToInt(amount * multiplier);
            currentCoins += finalAmount;
            OnCoinsChanged?.Invoke(currentCoins);
        }

        public void SelectVehicle(VehicleData vehicle)
        {
            selectedVehicle = vehicle;
            saveManager.Progress.selectedVehicle = vehicle.id;
            saveManager.Save();
        }

        public void SelectStage(StageData stage)
        {
            selectedStage = stage;
            saveManager.Progress.selectedStage = stage.id;
            saveManager.Save();
        }

        public bool PurchaseVehicle(string vehicleId)
        {
            var vehicle = vehicleDatabase.GetVehicle(vehicleId);
            if (vehicle == null) return false;
            if (saveManager.Progress.unlockedVehicles.Contains(vehicleId)) return true;
            if (saveManager.Progress.coins < vehicle.unlockCost) return false;

            saveManager.Progress.coins -= vehicle.unlockCost;
            saveManager.Progress.unlockedVehicles.Add(vehicleId);
            saveManager.Save();
            return true;
        }

        public bool PurchaseStage(string stageId)
        {
            var stage = stageDatabase.GetStage(stageId);
            if (stage == null) return false;
            if (saveManager.Progress.unlockedStages.Contains(stageId)) return true;
            if (saveManager.Progress.coins < stage.unlockCost) return false;

            saveManager.Progress.coins -= stage.unlockCost;
            saveManager.Progress.unlockedStages.Add(stageId);
            saveManager.Save();
            return true;
        }

        public bool PurchaseUpgrade(string vehicleId, UpgradeType type)
        {
            if (!saveManager.Progress.vehicleUpgrades.ContainsKey(vehicleId))
            {
                saveManager.Progress.vehicleUpgrades[vehicleId] = new UpgradeLevels();
            }

            var upgrades = saveManager.Progress.vehicleUpgrades[vehicleId];
            float cost = upgrades.GetUpgradeCost(type);
            if (cost < 0 || saveManager.Progress.coins < cost) return false;

            saveManager.Progress.coins -= (int)cost;
            upgrades.Upgrade(type);
            saveManager.Save();
            return true;
        }

        public VehicleStats GetUpgradedStats(VehicleData vehicle)
        {
            var baseStats = vehicle.baseStats;
            var stats = new VehicleStats
            {
                enginePower = baseStats.enginePower,
                wheelFriction = baseStats.wheelFriction,
                suspensionStiffness = baseStats.suspensionStiffness,
                suspensionDamping = baseStats.suspensionDamping,
                fuelCapacity = baseStats.fuelCapacity,
                fuelConsumption = baseStats.fuelConsumption,
                mass = baseStats.mass,
                wheelRadius = baseStats.wheelRadius
            };

            if (saveManager.Progress.vehicleUpgrades.TryGetValue(vehicle.id, out var upgrades))
            {
                stats.enginePower += upgrades.engine * 50f;
                stats.wheelFriction += upgrades.tires * 0.05f;
                stats.suspensionStiffness += upgrades.suspension * 0.02f;
                stats.fuelCapacity += upgrades.fuelTank * 10f;
            }

            return stats;
        }

        public int GetCoins() => saveManager.Progress.coins;
        public PlayerProgress GetProgress() => saveManager.Progress;
    }

    public enum GameState
    {
        MainMenu,
        Garage,
        StageSelect,
        Shop,
        Playing,
        Paused,
        GameOver,
        Leaderboard,
        DailyChallenge,
        Settings
    }
}
