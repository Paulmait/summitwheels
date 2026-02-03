using UnityEngine;
using System.Collections.Generic;
using SummitWheels.Vehicle;

namespace SummitWheels.Systems
{
    public class GhostSystem : MonoBehaviour
    {
        [Header("Settings")]
        public float recordFPS = 10f;
        public bool isRecording;
        public bool isPlayingBack;

        [Header("References")]
        public VehicleController playerVehicle;
        public Transform ghostVehicle;
        public SpriteRenderer ghostRenderer;

        [Header("Visual")]
        public Color ghostColor = new Color(1f, 1f, 1f, 0.5f);

        private List<GhostFrame> currentRecording = new List<GhostFrame>();
        private GhostRecording bestGhost;
        private float recordTimer;
        private int playbackIndex;
        private float playbackTimer;

        void Update()
        {
            if (isRecording && playerVehicle != null)
            {
                recordTimer += Time.deltaTime;
                if (recordTimer >= 1f / recordFPS)
                {
                    RecordFrame();
                    recordTimer = 0f;
                }
            }

            if (isPlayingBack && bestGhost != null)
            {
                PlaybackFrame();
            }
        }

        public void StartRecording()
        {
            currentRecording.Clear();
            recordTimer = 0f;
            isRecording = true;
            Debug.Log("Ghost recording started");
        }

        public void StopRecording(float finalDistance)
        {
            isRecording = false;

            if (currentRecording.Count > 0)
            {
                // Check if this is a new best
                if (bestGhost == null || finalDistance > bestGhost.distance)
                {
                    bestGhost = new GhostRecording
                    {
                        frames = new List<GhostFrame>(currentRecording),
                        distance = finalDistance,
                        timestamp = System.DateTime.Now
                    };
                    Debug.Log($"New ghost saved! Distance: {finalDistance}m, Frames: {currentRecording.Count}");
                }
            }
        }

        private void RecordFrame()
        {
            if (playerVehicle == null) return;

            var frame = new GhostFrame
            {
                position = playerVehicle.transform.position,
                rotation = playerVehicle.transform.rotation,
                velocity = playerVehicle.rb.velocity,
                time = Time.time
            };

            currentRecording.Add(frame);
        }

        public void StartPlayback()
        {
            if (bestGhost == null || bestGhost.frames.Count == 0)
            {
                Debug.Log("No ghost to play back");
                return;
            }

            isPlayingBack = true;
            playbackIndex = 0;
            playbackTimer = 0f;

            if (ghostVehicle != null)
            {
                ghostVehicle.gameObject.SetActive(true);
            }

            if (ghostRenderer != null)
            {
                ghostRenderer.color = ghostColor;
            }

            Debug.Log("Ghost playback started");
        }

        public void StopPlayback()
        {
            isPlayingBack = false;
            if (ghostVehicle != null)
            {
                ghostVehicle.gameObject.SetActive(false);
            }
        }

        private void PlaybackFrame()
        {
            if (bestGhost == null || playbackIndex >= bestGhost.frames.Count)
            {
                StopPlayback();
                return;
            }

            playbackTimer += Time.deltaTime;

            // Find the appropriate frame based on elapsed time
            while (playbackIndex < bestGhost.frames.Count - 1)
            {
                float frameTime = playbackIndex / recordFPS;
                if (frameTime > playbackTimer) break;
                playbackIndex++;
            }

            // Interpolate between frames
            if (playbackIndex < bestGhost.frames.Count)
            {
                var frame = bestGhost.frames[playbackIndex];

                if (playbackIndex > 0 && playbackIndex < bestGhost.frames.Count - 1)
                {
                    var prevFrame = bestGhost.frames[playbackIndex - 1];
                    var nextFrame = bestGhost.frames[playbackIndex];
                    float t = (playbackTimer * recordFPS) - playbackIndex;
                    t = Mathf.Clamp01(t);

                    ghostVehicle.position = Vector3.Lerp(prevFrame.position, nextFrame.position, t);
                    ghostVehicle.rotation = Quaternion.Slerp(prevFrame.rotation, nextFrame.rotation, t);
                }
                else
                {
                    ghostVehicle.position = frame.position;
                    ghostVehicle.rotation = frame.rotation;
                }
            }
        }

        public float GetTimeDelta()
        {
            if (!isPlayingBack || bestGhost == null || playerVehicle == null)
                return 0f;

            // Calculate time difference between player and ghost at same distance
            float playerDistance = Core.GameManager.Instance?.currentDistance ?? 0f;

            // Find ghost frame at similar distance
            for (int i = 0; i < bestGhost.frames.Count; i++)
            {
                if (bestGhost.frames[i].position.x >= playerDistance)
                {
                    float ghostTime = i / recordFPS;
                    float playerTime = Time.time;
                    return playerTime - ghostTime;
                }
            }

            return 0f;
        }

        public void ClearGhost()
        {
            bestGhost = null;
            currentRecording.Clear();
            StopPlayback();
        }

        public bool HasGhost() => bestGhost != null && bestGhost.frames.Count > 0;

        public float GetGhostDistance() => bestGhost?.distance ?? 0f;
    }

    [System.Serializable]
    public class GhostFrame
    {
        public Vector3 position;
        public Quaternion rotation;
        public Vector2 velocity;
        public float time;
    }

    [System.Serializable]
    public class GhostRecording
    {
        public List<GhostFrame> frames;
        public float distance;
        public System.DateTime timestamp;
    }
}
