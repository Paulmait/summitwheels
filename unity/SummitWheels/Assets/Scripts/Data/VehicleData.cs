using UnityEngine;

namespace SummitWheels.Data
{
    [CreateAssetMenu(fileName = "NewVehicle", menuName = "Summit Wheels/Vehicle Data")]
    public class VehicleData : ScriptableObject
    {
        public string id;
        public string vehicleName;
        [TextArea] public string description;
        public int unlockCost;
        public Sprite icon;
        public GameObject prefab;
        public VehicleStats baseStats;
        [Range(1, 5)] public int starRating;
    }

    [System.Serializable]
    public class VehicleStats
    {
        public float enginePower = 800f;
        public float wheelFriction = 0.8f;
        public float suspensionStiffness = 0.3f;
        public float suspensionDamping = 0.2f;
        public float fuelCapacity = 100f;
        public float fuelConsumption = 1f;
        public float mass = 500f;
        public float wheelRadius = 0.5f;
    }

    [System.Serializable]
    public class UpgradeLevels
    {
        public int engine;
        public int tires;
        public int suspension;
        public int fuelTank;

        public static readonly int MAX_LEVEL = 10;
        public static readonly float[] ENGINE_COSTS = { 50, 75, 113, 169, 253, 380, 570, 855, 1282, 1923 };
        public static readonly float[] TIRES_COSTS = { 40, 60, 90, 135, 203, 304, 456, 684, 1026, 1539 };
        public static readonly float[] SUSPENSION_COSTS = { 45, 68, 101, 152, 228, 342, 513, 769, 1154, 1731 };
        public static readonly float[] FUEL_COSTS = { 35, 53, 79, 118, 178, 266, 400, 600, 900, 1350 };

        public float GetUpgradeCost(UpgradeType type)
        {
            int level = GetLevel(type);
            if (level >= MAX_LEVEL) return -1;

            return type switch
            {
                UpgradeType.Engine => ENGINE_COSTS[level],
                UpgradeType.Tires => TIRES_COSTS[level],
                UpgradeType.Suspension => SUSPENSION_COSTS[level],
                UpgradeType.FuelTank => FUEL_COSTS[level],
                _ => 0
            };
        }

        public int GetLevel(UpgradeType type)
        {
            return type switch
            {
                UpgradeType.Engine => engine,
                UpgradeType.Tires => tires,
                UpgradeType.Suspension => suspension,
                UpgradeType.FuelTank => fuelTank,
                _ => 0
            };
        }

        public void Upgrade(UpgradeType type)
        {
            switch (type)
            {
                case UpgradeType.Engine: engine = Mathf.Min(engine + 1, MAX_LEVEL); break;
                case UpgradeType.Tires: tires = Mathf.Min(tires + 1, MAX_LEVEL); break;
                case UpgradeType.Suspension: suspension = Mathf.Min(suspension + 1, MAX_LEVEL); break;
                case UpgradeType.FuelTank: fuelTank = Mathf.Min(fuelTank + 1, MAX_LEVEL); break;
            }
        }
    }

    public enum UpgradeType
    {
        Engine,
        Tires,
        Suspension,
        FuelTank
    }
}
