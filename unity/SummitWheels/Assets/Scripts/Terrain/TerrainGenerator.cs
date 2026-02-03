using UnityEngine;
using System.Collections.Generic;
using SummitWheels.Data;

namespace SummitWheels.Terrain
{
    public class TerrainGenerator : MonoBehaviour
    {
        [Header("Settings")]
        public float chunkWidth = 20f;
        public int chunksAhead = 3;
        public int chunksBehind = 1;
        public float baseHeight = 0f;
        public float noiseScale = 0.1f;
        public float heightMultiplier = 5f;

        [Header("Terrain Settings")]
        public float terrainRoughness = 0.5f;
        public PhysicsMaterial2D groundMaterial;

        [Header("References")]
        public Transform player;
        public StageData currentStage;

        [Header("Prefabs")]
        public GameObject coinPrefab;
        public GameObject fuelCanPrefab;
        public float coinSpacing = 5f;
        public float fuelSpacing = 50f;

        private Dictionary<int, TerrainChunk> chunks = new Dictionary<int, TerrainChunk>();
        private int lastPlayerChunk;
        private float noiseSeed;

        void Start()
        {
            noiseSeed = Random.Range(0f, 1000f);
            GenerateInitialChunks();
        }

        void Update()
        {
            if (player == null) return;

            int currentChunk = Mathf.FloorToInt(player.position.x / chunkWidth);

            if (currentChunk != lastPlayerChunk)
            {
                UpdateChunks(currentChunk);
                lastPlayerChunk = currentChunk;
            }
        }

        public void SetStage(StageData stage)
        {
            currentStage = stage;
            if (stage != null)
            {
                terrainRoughness = stage.physics.terrainRoughness;
            }
        }

        private void GenerateInitialChunks()
        {
            lastPlayerChunk = 0;
            for (int i = -chunksBehind; i <= chunksAhead; i++)
            {
                CreateChunk(i);
            }
        }

        private void UpdateChunks(int currentChunk)
        {
            // Create new chunks ahead
            for (int i = currentChunk - chunksBehind; i <= currentChunk + chunksAhead; i++)
            {
                if (!chunks.ContainsKey(i))
                {
                    CreateChunk(i);
                }
            }

            // Remove old chunks
            List<int> chunksToRemove = new List<int>();
            foreach (var kvp in chunks)
            {
                if (kvp.Key < currentChunk - chunksBehind - 1 || kvp.Key > currentChunk + chunksAhead + 1)
                {
                    chunksToRemove.Add(kvp.Key);
                }
            }

            foreach (int index in chunksToRemove)
            {
                if (chunks.TryGetValue(index, out var chunk))
                {
                    chunk.Destroy();
                    chunks.Remove(index);
                }
            }
        }

        private void CreateChunk(int index)
        {
            float startX = index * chunkWidth;

            // Create terrain object
            GameObject chunkObj = new GameObject($"Chunk_{index}");
            chunkObj.transform.parent = transform;
            chunkObj.transform.position = new Vector3(startX, 0, 0);
            chunkObj.tag = "Ground";
            chunkObj.layer = LayerMask.NameToLayer("Ground");

            // Generate terrain points
            List<Vector2> points = GenerateTerrainPoints(startX, chunkWidth);

            // Create edge collider
            EdgeCollider2D collider = chunkObj.AddComponent<EdgeCollider2D>();
            collider.points = points.ToArray();
            if (groundMaterial != null)
            {
                collider.sharedMaterial = groundMaterial;
            }

            // Create visual mesh
            CreateTerrainMesh(chunkObj, points);

            // Spawn pickups
            SpawnPickups(chunkObj, startX);

            // Store chunk
            var chunk = new TerrainChunk
            {
                index = index,
                gameObject = chunkObj,
                collider = collider
            };
            chunks[index] = chunk;
        }

        private List<Vector2> GenerateTerrainPoints(float startX, float width)
        {
            List<Vector2> points = new List<Vector2>();
            int pointCount = Mathf.CeilToInt(width * 2); // 2 points per unit

            for (int i = 0; i <= pointCount; i++)
            {
                float x = (i / (float)pointCount) * width;
                float worldX = startX + x;

                // Multi-octave Perlin noise for natural terrain
                float height = 0f;
                float amplitude = 1f;
                float frequency = noiseScale;

                for (int octave = 0; octave < 3; octave++)
                {
                    float sampleX = (worldX + noiseSeed) * frequency;
                    height += (Mathf.PerlinNoise(sampleX, noiseSeed) - 0.5f) * 2 * amplitude;
                    amplitude *= 0.5f;
                    frequency *= 2f;
                }

                height *= heightMultiplier * terrainRoughness;
                height += baseHeight;

                // Apply stage-specific modifications
                if (currentStage != null)
                {
                    height *= (1f + (currentStage.physics.terrainRoughness - 0.5f));
                }

                points.Add(new Vector2(x, height));
            }

            return points;
        }

        private void CreateTerrainMesh(GameObject parent, List<Vector2> topPoints)
        {
            MeshFilter meshFilter = parent.AddComponent<MeshFilter>();
            MeshRenderer meshRenderer = parent.AddComponent<MeshRenderer>();

            // Create mesh
            Mesh mesh = new Mesh();
            List<Vector3> vertices = new List<Vector3>();
            List<int> triangles = new List<int>();
            List<Vector2> uvs = new List<Vector2>();

            float bottomY = -10f;

            // Create vertices
            for (int i = 0; i < topPoints.Count; i++)
            {
                vertices.Add(new Vector3(topPoints[i].x, topPoints[i].y, 0));
                vertices.Add(new Vector3(topPoints[i].x, bottomY, 0));

                float u = topPoints[i].x / chunkWidth;
                uvs.Add(new Vector2(u, 1));
                uvs.Add(new Vector2(u, 0));

                if (i < topPoints.Count - 1)
                {
                    int baseIndex = i * 2;
                    // First triangle
                    triangles.Add(baseIndex);
                    triangles.Add(baseIndex + 2);
                    triangles.Add(baseIndex + 1);
                    // Second triangle
                    triangles.Add(baseIndex + 1);
                    triangles.Add(baseIndex + 2);
                    triangles.Add(baseIndex + 3);
                }
            }

            mesh.vertices = vertices.ToArray();
            mesh.triangles = triangles.ToArray();
            mesh.uv = uvs.ToArray();
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();

            meshFilter.mesh = mesh;

            // Set material color based on stage
            Color groundColor = currentStage != null ? currentStage.visuals.groundColor : new Color(0.4f, 0.3f, 0.2f);
            Material mat = new Material(Shader.Find("Sprites/Default"));
            mat.color = groundColor;
            meshRenderer.material = mat;
        }

        private void SpawnPickups(GameObject parent, float startX)
        {
            // Spawn coins
            if (coinPrefab != null)
            {
                int coinCount = Mathf.FloorToInt(chunkWidth / coinSpacing);
                for (int i = 0; i < coinCount; i++)
                {
                    float x = startX + (i + 0.5f) * (chunkWidth / coinCount);
                    float y = GetHeightAt(x) + 1.5f;

                    // Randomize slightly
                    if (Random.value > 0.3f)
                    {
                        GameObject coin = Instantiate(coinPrefab, new Vector3(x, y, 0), Quaternion.identity, parent.transform);
                        coin.transform.localPosition = new Vector3(x - startX, y, 0);
                    }
                }
            }

            // Spawn fuel cans (less frequent)
            if (fuelCanPrefab != null && Random.value > 0.7f)
            {
                float x = startX + Random.Range(chunkWidth * 0.2f, chunkWidth * 0.8f);
                float y = GetHeightAt(x) + 1f;
                GameObject fuel = Instantiate(fuelCanPrefab, new Vector3(x, y, 0), Quaternion.identity, parent.transform);
                fuel.transform.localPosition = new Vector3(x - startX, y, 0);
            }
        }

        public float GetHeightAt(float worldX)
        {
            float height = 0f;
            float amplitude = 1f;
            float frequency = noiseScale;

            for (int octave = 0; octave < 3; octave++)
            {
                float sampleX = (worldX + noiseSeed) * frequency;
                height += (Mathf.PerlinNoise(sampleX, noiseSeed) - 0.5f) * 2 * amplitude;
                amplitude *= 0.5f;
                frequency *= 2f;
            }

            height *= heightMultiplier * terrainRoughness;
            height += baseHeight;

            return height;
        }

        public void Reset()
        {
            // Clear all chunks
            foreach (var chunk in chunks.Values)
            {
                chunk.Destroy();
            }
            chunks.Clear();

            // Regenerate with new seed
            noiseSeed = Random.Range(0f, 1000f);
            GenerateInitialChunks();
        }
    }

    public class TerrainChunk
    {
        public int index;
        public GameObject gameObject;
        public EdgeCollider2D collider;

        public void Destroy()
        {
            if (gameObject != null)
            {
                Object.Destroy(gameObject);
            }
        }
    }
}
