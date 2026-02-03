using UnityEngine;
using System.Collections.Generic;

namespace SummitWheels.Data
{
    [CreateAssetMenu(fileName = "VehicleDatabase", menuName = "Summit Wheels/Vehicle Database")]
    public class VehicleDatabase : ScriptableObject
    {
        public List<VehicleData> vehicles = new List<VehicleData>();

        public VehicleData GetVehicle(string id)
        {
            return vehicles.Find(v => v.id == id);
        }

        public VehicleData GetDefaultVehicle()
        {
            return vehicles.Count > 0 ? vehicles[0] : null;
        }

        public List<VehicleData> GetUnlockedVehicles(List<string> unlockedIds)
        {
            return vehicles.FindAll(v => unlockedIds.Contains(v.id));
        }

        public List<VehicleData> GetLockedVehicles(List<string> unlockedIds)
        {
            return vehicles.FindAll(v => !unlockedIds.Contains(v.id));
        }

        public int GetVehicleCount() => vehicles.Count;

#if UNITY_EDITOR
        [ContextMenu("Create Default Vehicles")]
        public void CreateDefaultVehicles()
        {
            vehicles.Clear();

            // Jeep (Starter)
            var jeep = CreateVehicleData("jeep", "Jeep", "Reliable starter vehicle. Great for beginners!", 0, 2);
            jeep.baseStats = new VehicleStats
            {
                enginePower = 800f,
                wheelFriction = 0.8f,
                suspensionStiffness = 0.3f,
                suspensionDamping = 0.2f,
                fuelCapacity = 100f,
                fuelConsumption = 1f,
                mass = 500f,
                wheelRadius = 0.5f
            };
            vehicles.Add(jeep);

            // Monster Truck
            var monsterTruck = CreateVehicleData("monster_truck", "Monster Truck", "Big wheels, great traction. Handles rough terrain easily.", 5000, 3);
            monsterTruck.baseStats = new VehicleStats
            {
                enginePower = 1200f,
                wheelFriction = 1.0f,
                suspensionStiffness = 0.25f,
                suspensionDamping = 0.15f,
                fuelCapacity = 120f,
                fuelConsumption = 1.5f,
                mass = 800f,
                wheelRadius = 0.8f
            };
            vehicles.Add(monsterTruck);

            // Dune Buggy
            var duneBuggy = CreateVehicleData("dune_buggy", "Dune Buggy", "Lightweight and fast. Perfect for sandy terrain.", 10000, 3);
            duneBuggy.baseStats = new VehicleStats
            {
                enginePower = 600f,
                wheelFriction = 0.6f,
                suspensionStiffness = 0.4f,
                suspensionDamping = 0.3f,
                fuelCapacity = 80f,
                fuelConsumption = 0.8f,
                mass = 300f,
                wheelRadius = 0.4f
            };
            vehicles.Add(duneBuggy);

            // Tank
            var tank = CreateVehicleData("tank", "Tank", "Heavy and powerful. Crushes anything in its path.", 25000, 4);
            tank.baseStats = new VehicleStats
            {
                enginePower = 2000f,
                wheelFriction = 1.2f,
                suspensionStiffness = 0.5f,
                suspensionDamping = 0.4f,
                fuelCapacity = 200f,
                fuelConsumption = 2.5f,
                mass = 1500f,
                wheelRadius = 0.6f
            };
            vehicles.Add(tank);

            // Super Car
            var superCar = CreateVehicleData("super_car", "Super Car", "Speed demon. Fastest on flat terrain.", 50000, 4);
            superCar.baseStats = new VehicleStats
            {
                enginePower = 1500f,
                wheelFriction = 0.9f,
                suspensionStiffness = 0.35f,
                suspensionDamping = 0.25f,
                fuelCapacity = 90f,
                fuelConsumption = 1.8f,
                mass = 400f,
                wheelRadius = 0.35f
            };
            vehicles.Add(superCar);

            // Moon Rover
            var moonRover = CreateVehicleData("moon_rover", "Moon Rover", "Ultimate off-road machine. Designed for extreme conditions.", 75000, 5);
            moonRover.baseStats = new VehicleStats
            {
                enginePower = 1000f,
                wheelFriction = 1.1f,
                suspensionStiffness = 0.2f,
                suspensionDamping = 0.1f,
                fuelCapacity = 150f,
                fuelConsumption = 1.2f,
                mass = 600f,
                wheelRadius = 0.7f
            };
            vehicles.Add(moonRover);

            UnityEditor.EditorUtility.SetDirty(this);
            Debug.Log("Created 6 default vehicles");
        }

        private VehicleData CreateVehicleData(string id, string name, string desc, int cost, int stars)
        {
            var data = ScriptableObject.CreateInstance<VehicleData>();
            data.id = id;
            data.vehicleName = name;
            data.description = desc;
            data.unlockCost = cost;
            data.starRating = stars;
            return data;
        }
#endif
    }
}
