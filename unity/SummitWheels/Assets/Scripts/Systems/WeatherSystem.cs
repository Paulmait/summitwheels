using UnityEngine;
using SummitWheels.Data;

namespace SummitWheels.Systems
{
    public class WeatherSystem : MonoBehaviour
    {
        [Header("Particle Systems")]
        public ParticleSystem snowParticles;
        public ParticleSystem rainParticles;
        public ParticleSystem sandstormParticles;
        public ParticleSystem ashParticles;

        [Header("Fog")]
        public SpriteRenderer fogOverlay;
        public float fogAlpha = 0.3f;

        [Header("Settings")]
        public int particleCount = 100;
        public float emissionRate = 50f;

        private WeatherType currentWeather = WeatherType.None;

        public void SetWeather(WeatherType weather, StageVisuals visuals = null)
        {
            // Disable all weather
            StopAllWeather();

            currentWeather = weather;

            switch (weather)
            {
                case WeatherType.Snow:
                    EnableSnow();
                    break;
                case WeatherType.Rain:
                    EnableRain();
                    break;
                case WeatherType.Sandstorm:
                    EnableSandstorm();
                    break;
                case WeatherType.Ash:
                    EnableAsh();
                    break;
            }

            // Handle fog
            if (visuals != null && visuals.hasFog && fogOverlay != null)
            {
                fogOverlay.gameObject.SetActive(true);
                Color fogColor = fogOverlay.color;
                fogColor.a = visuals.fogDensity > 0 ? visuals.fogDensity : fogAlpha;
                fogOverlay.color = fogColor;
            }
            else if (fogOverlay != null)
            {
                fogOverlay.gameObject.SetActive(false);
            }
        }

        private void StopAllWeather()
        {
            if (snowParticles != null) snowParticles.Stop();
            if (rainParticles != null) rainParticles.Stop();
            if (sandstormParticles != null) sandstormParticles.Stop();
            if (ashParticles != null) ashParticles.Stop();
        }

        private void EnableSnow()
        {
            if (snowParticles == null)
            {
                snowParticles = CreateParticleSystem("Snow", Color.white);
                ConfigureSnowParticles(snowParticles);
            }
            snowParticles.Play();
        }

        private void EnableRain()
        {
            if (rainParticles == null)
            {
                rainParticles = CreateParticleSystem("Rain", new Color(0.6f, 0.7f, 0.9f, 0.7f));
                ConfigureRainParticles(rainParticles);
            }
            rainParticles.Play();
        }

        private void EnableSandstorm()
        {
            if (sandstormParticles == null)
            {
                sandstormParticles = CreateParticleSystem("Sandstorm", new Color(0.85f, 0.75f, 0.55f, 0.5f));
                ConfigureSandstormParticles(sandstormParticles);
            }
            sandstormParticles.Play();
        }

        private void EnableAsh()
        {
            if (ashParticles == null)
            {
                ashParticles = CreateParticleSystem("Ash", new Color(0.3f, 0.3f, 0.3f, 0.6f));
                ConfigureAshParticles(ashParticles);
            }
            ashParticles.Play();
        }

        private ParticleSystem CreateParticleSystem(string name, Color color)
        {
            GameObject go = new GameObject(name + "Particles");
            go.transform.SetParent(transform);
            go.transform.localPosition = Vector3.zero;

            ParticleSystem ps = go.AddComponent<ParticleSystem>();
            var main = ps.main;
            main.startColor = color;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.maxParticles = particleCount;

            var emission = ps.emission;
            emission.rateOverTime = emissionRate;

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(30, 1, 1);
            shape.position = new Vector3(0, 15, 0);

            return ps;
        }

        private void ConfigureSnowParticles(ParticleSystem ps)
        {
            var main = ps.main;
            main.startLifetime = 5f;
            main.startSpeed = 2f;
            main.startSize = 0.15f;
            main.gravityModifier = 0.1f;

            var velocityOverLifetime = ps.velocityOverLifetime;
            velocityOverLifetime.enabled = true;
            velocityOverLifetime.x = new ParticleSystem.MinMaxCurve(-0.5f, 0.5f);
        }

        private void ConfigureRainParticles(ParticleSystem ps)
        {
            var main = ps.main;
            main.startLifetime = 1f;
            main.startSpeed = 15f;
            main.startSize = new ParticleSystem.MinMaxCurve(0.02f, 0.05f);
            main.gravityModifier = 1f;

            var shape = ps.shape;
            shape.rotation = new Vector3(-15, 0, 0);
        }

        private void ConfigureSandstormParticles(ParticleSystem ps)
        {
            var main = ps.main;
            main.startLifetime = 3f;
            main.startSpeed = 8f;
            main.startSize = new ParticleSystem.MinMaxCurve(0.2f, 0.5f);
            main.gravityModifier = 0.05f;

            var shape = ps.shape;
            shape.position = new Vector3(-20, 5, 0);
            shape.rotation = new Vector3(0, 0, -10);

            var velocityOverLifetime = ps.velocityOverLifetime;
            velocityOverLifetime.enabled = true;
            velocityOverLifetime.x = new ParticleSystem.MinMaxCurve(5f, 10f);
            velocityOverLifetime.y = new ParticleSystem.MinMaxCurve(-1f, 1f);
        }

        private void ConfigureAshParticles(ParticleSystem ps)
        {
            var main = ps.main;
            main.startLifetime = 4f;
            main.startSpeed = 1f;
            main.startSize = new ParticleSystem.MinMaxCurve(0.1f, 0.3f);
            main.gravityModifier = -0.05f; // Float upward slightly

            var velocityOverLifetime = ps.velocityOverLifetime;
            velocityOverLifetime.enabled = true;
            velocityOverLifetime.x = new ParticleSystem.MinMaxCurve(-1f, 1f);
            velocityOverLifetime.y = new ParticleSystem.MinMaxCurve(0f, 1f);
        }

        public void FollowPlayer(Transform player)
        {
            if (player != null)
            {
                Vector3 pos = transform.position;
                pos.x = player.position.x;
                transform.position = pos;
            }
        }

        void Update()
        {
            // Follow camera or player
            if (Camera.main != null)
            {
                Vector3 pos = transform.position;
                pos.x = Camera.main.transform.position.x;
                pos.y = Camera.main.transform.position.y + 10f;
                transform.position = pos;
            }
        }
    }
}
