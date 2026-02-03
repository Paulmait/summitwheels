using UnityEngine;

namespace SummitWheels.Data
{
    [CreateAssetMenu(fileName = "NewStage", menuName = "Summit Wheels/Stage Data")]
    public class StageData : ScriptableObject
    {
        public string id;
        public string stageName;
        [TextArea] public string description;
        public int unlockCost;
        public Sprite icon;
        public Sprite backgroundSprite;
        public StagePhysics physics;
        public StageVisuals visuals;
        public float coinMultiplier = 1f;
        public float fuelPickupMultiplier = 1f;
    }

    [System.Serializable]
    public class StagePhysics
    {
        public float gravityMultiplier = 1f;
        public float friction = 0.4f;
        public float terrainRoughness = 0.5f;
    }

    [System.Serializable]
    public class StageVisuals
    {
        public Color skyColor = new Color(0.5f, 0.7f, 1f);
        public Color groundColor = new Color(0.4f, 0.3f, 0.2f);
        public Color accentColor = new Color(0.3f, 0.6f, 0.3f);
        public WeatherType weather = WeatherType.None;
        public bool hasFog = false;
        public float fogDensity = 0f;
    }

    public enum WeatherType
    {
        None,
        Snow,
        Rain,
        Sandstorm,
        Ash
    }
}
