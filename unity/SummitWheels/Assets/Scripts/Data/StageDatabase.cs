using UnityEngine;
using System.Collections.Generic;

namespace SummitWheels.Data
{
    [CreateAssetMenu(fileName = "StageDatabase", menuName = "Summit Wheels/Stage Database")]
    public class StageDatabase : ScriptableObject
    {
        public List<StageData> stages = new List<StageData>();

        public StageData GetStage(string id)
        {
            return stages.Find(s => s.id == id);
        }

        public StageData GetDefaultStage()
        {
            return stages.Count > 0 ? stages[0] : null;
        }

        public List<StageData> GetUnlockedStages(List<string> unlockedIds)
        {
            return stages.FindAll(s => unlockedIds.Contains(s.id));
        }

        public List<StageData> GetLockedStages(List<string> unlockedIds)
        {
            return stages.FindAll(s => !unlockedIds.Contains(s.id));
        }

        public int GetStageCount() => stages.Count;

#if UNITY_EDITOR
        [ContextMenu("Create Default Stages")]
        public void CreateDefaultStages()
        {
            stages.Clear();

            // Countryside (Starter)
            var countryside = CreateStageData("countryside", "Countryside", "Rolling green hills. A peaceful start to your journey.", 0);
            countryside.physics = new StagePhysics { gravityMultiplier = 1.0f, friction = 0.4f, terrainRoughness = 0.3f };
            countryside.visuals = new StageVisuals
            {
                skyColor = new Color(0.5f, 0.7f, 1f),
                groundColor = new Color(0.4f, 0.55f, 0.3f),
                accentColor = new Color(0.3f, 0.6f, 0.3f),
                weather = WeatherType.None
            };
            stages.Add(countryside);

            // Desert
            var desert = CreateStageData("desert", "Desert", "Sandy dunes with low friction. Watch your grip!", 2500);
            desert.physics = new StagePhysics { gravityMultiplier = 1.0f, friction = 0.25f, terrainRoughness = 0.5f };
            desert.visuals = new StageVisuals
            {
                skyColor = new Color(0.9f, 0.8f, 0.6f),
                groundColor = new Color(0.85f, 0.75f, 0.55f),
                accentColor = new Color(0.95f, 0.85f, 0.6f),
                weather = WeatherType.Sandstorm
            };
            stages.Add(desert);

            // Arctic
            var arctic = CreateStageData("arctic", "Arctic", "Icy and slippery. Precision driving required.", 7500);
            arctic.physics = new StagePhysics { gravityMultiplier = 1.0f, friction = 0.15f, terrainRoughness = 0.4f };
            arctic.visuals = new StageVisuals
            {
                skyColor = new Color(0.7f, 0.85f, 1f),
                groundColor = new Color(0.9f, 0.95f, 1f),
                accentColor = new Color(0.6f, 0.8f, 0.95f),
                weather = WeatherType.Snow
            };
            stages.Add(arctic);

            // Forest
            var forest = CreateStageData("forest", "Forest", "Dense woodland with challenging terrain.", 15000);
            forest.physics = new StagePhysics { gravityMultiplier = 1.0f, friction = 0.45f, terrainRoughness = 0.6f };
            forest.visuals = new StageVisuals
            {
                skyColor = new Color(0.4f, 0.55f, 0.4f),
                groundColor = new Color(0.35f, 0.3f, 0.2f),
                accentColor = new Color(0.2f, 0.5f, 0.25f),
                weather = WeatherType.Rain
            };
            stages.Add(forest);

            // Moon
            var moon = CreateStageData("moon", "Moon", "Low gravity lunar surface. Float through the craters!", 20000);
            moon.physics = new StagePhysics { gravityMultiplier = 0.16f, friction = 0.5f, terrainRoughness = 0.7f };
            moon.visuals = new StageVisuals
            {
                skyColor = new Color(0.05f, 0.05f, 0.1f),
                groundColor = new Color(0.5f, 0.5f, 0.5f),
                accentColor = new Color(0.6f, 0.6f, 0.6f),
                weather = WeatherType.None
            };
            stages.Add(moon);

            // Volcano
            var volcano = CreateStageData("volcano", "Volcano", "Dangerous volcanic terrain. High gravity, extreme challenge!", 40000);
            volcano.physics = new StagePhysics { gravityMultiplier = 1.2f, friction = 0.5f, terrainRoughness = 0.8f };
            volcano.visuals = new StageVisuals
            {
                skyColor = new Color(0.3f, 0.15f, 0.1f),
                groundColor = new Color(0.2f, 0.15f, 0.12f),
                accentColor = new Color(0.9f, 0.3f, 0.1f),
                weather = WeatherType.Ash
            };
            stages.Add(volcano);

            UnityEditor.EditorUtility.SetDirty(this);
            Debug.Log("Created 6 default stages");
        }

        private StageData CreateStageData(string id, string name, string desc, int cost)
        {
            var data = ScriptableObject.CreateInstance<StageData>();
            data.id = id;
            data.stageName = name;
            data.description = desc;
            data.unlockCost = cost;
            data.coinMultiplier = 1f + (cost / 50000f); // Higher stages give more coins
            data.fuelPickupMultiplier = 1f;
            return data;
        }
#endif
    }
}
