/**
 * Ghost Racing System
 *
 * UNIQUE TO SUMMIT WHEELS:
 * Race against your personal best or friends' ghosts.
 * See exactly where you were and try to beat it.
 */

export type GhostFrame = {
  /** Time from start (ms) */
  time: number;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Rotation angle */
  angle: number;
  /** Is boosting */
  isBoosting: boolean;
};

export type GhostRun = {
  /** Unique ID */
  id: string;
  /** Player name or "Personal Best" */
  playerName: string;
  /** Vehicle used */
  vehicleId: string;
  /** Stage played */
  stageId: string;
  /** Final distance */
  distance: number;
  /** Total coins collected */
  coins: number;
  /** Recording date */
  recordedAt: number;
  /** Frame data (compressed) */
  frames: GhostFrame[];
  /** Frame interval (ms) */
  frameInterval: number;
};

export type GhostRecorderState = {
  /** Is recording */
  isRecording: boolean;
  /** Current frames */
  frames: GhostFrame[];
  /** Recording start time */
  startTime: number;
  /** Last frame time */
  lastFrameTime: number;
};

export type GhostRecorder = {
  /** Start recording */
  start: () => void;
  /** Record a frame */
  recordFrame: (
    x: number,
    y: number,
    angle: number,
    isBoosting: boolean
  ) => void;
  /** Stop recording and get ghost data */
  stop: (
    vehicleId: string,
    stageId: string,
    distance: number,
    coins: number
  ) => GhostRun;
  /** Reset recorder */
  reset: () => void;
  /** Get state */
  getState: () => GhostRecorderState;
};

export type GhostPlayerState = {
  /** Is playing */
  isPlaying: boolean;
  /** Current frame index */
  frameIndex: number;
  /** Current ghost position */
  x: number;
  y: number;
  angle: number;
  isBoosting: boolean;
  /** Distance ahead/behind player */
  distanceDelta: number;
  /** Time ahead/behind (ms) */
  timeDelta: number;
};

export type GhostPlayer = {
  /** Start playback */
  start: (ghost: GhostRun) => void;
  /** Update to current time */
  update: (currentTime: number, playerX: number) => void;
  /** Stop playback */
  stop: () => void;
  /** Get state */
  getState: () => GhostPlayerState;
  /** Get ghost info */
  getGhostInfo: () => { name: string; distance: number } | null;
};

/**
 * Recording interval in ms (every 50ms = 20fps)
 */
const FRAME_INTERVAL = 50;

/**
 * Create ghost recorder
 */
export function createGhostRecorder(): GhostRecorder {
  let state: GhostRecorderState = {
    isRecording: false,
    frames: [],
    startTime: 0,
    lastFrameTime: 0,
  };

  const start = (): void => {
    state = {
      isRecording: true,
      frames: [],
      startTime: performance.now(),
      lastFrameTime: 0,
    };
  };

  const recordFrame = (
    x: number,
    y: number,
    angle: number,
    isBoosting: boolean
  ): void => {
    if (!state.isRecording) return;

    const currentTime = performance.now() - state.startTime;

    // Only record at interval
    if (currentTime - state.lastFrameTime < FRAME_INTERVAL) return;

    state.frames.push({
      time: currentTime,
      x,
      y,
      angle,
      isBoosting,
    });

    state.lastFrameTime = currentTime;
  };

  const stop = (
    vehicleId: string,
    stageId: string,
    distance: number,
    coins: number
  ): GhostRun => {
    state.isRecording = false;

    return {
      id: `ghost_${Date.now()}`,
      playerName: 'Personal Best',
      vehicleId,
      stageId,
      distance,
      coins,
      recordedAt: Date.now(),
      frames: state.frames,
      frameInterval: FRAME_INTERVAL,
    };
  };

  const reset = (): void => {
    state = {
      isRecording: false,
      frames: [],
      startTime: 0,
      lastFrameTime: 0,
    };
  };

  return {
    start,
    recordFrame,
    stop,
    reset,
    getState: () => ({ ...state }),
  };
}

/**
 * Create ghost player
 */
export function createGhostPlayer(): GhostPlayer {
  let ghost: GhostRun | null = null;
  let state: GhostPlayerState = {
    isPlaying: false,
    frameIndex: 0,
    x: 0,
    y: 0,
    angle: 0,
    isBoosting: false,
    distanceDelta: 0,
    timeDelta: 0,
  };

  const start = (ghostRun: GhostRun): void => {
    ghost = ghostRun;
    state = {
      isPlaying: true,
      frameIndex: 0,
      x: ghost.frames[0]?.x ?? 0,
      y: ghost.frames[0]?.y ?? 0,
      angle: ghost.frames[0]?.angle ?? 0,
      isBoosting: ghost.frames[0]?.isBoosting ?? false,
      distanceDelta: 0,
      timeDelta: 0,
    };
  };

  const update = (currentTime: number, playerX: number): void => {
    if (!state.isPlaying || !ghost || ghost.frames.length === 0) return;

    // Find the frame for current time
    while (
      state.frameIndex < ghost.frames.length - 1 &&
      ghost.frames[state.frameIndex + 1].time <= currentTime
    ) {
      state.frameIndex++;
    }

    const currentFrame = ghost.frames[state.frameIndex];
    const nextFrame = ghost.frames[state.frameIndex + 1];

    if (nextFrame) {
      // Interpolate between frames
      const frameDuration = nextFrame.time - currentFrame.time;
      const frameProgress =
        (currentTime - currentFrame.time) / frameDuration;

      state.x = currentFrame.x + (nextFrame.x - currentFrame.x) * frameProgress;
      state.y = currentFrame.y + (nextFrame.y - currentFrame.y) * frameProgress;
      state.angle =
        currentFrame.angle +
        (nextFrame.angle - currentFrame.angle) * frameProgress;
      state.isBoosting = currentFrame.isBoosting;
    } else {
      // Last frame
      state.x = currentFrame.x;
      state.y = currentFrame.y;
      state.angle = currentFrame.angle;
      state.isBoosting = currentFrame.isBoosting;
    }

    // Calculate delta from player
    state.distanceDelta = state.x - playerX;

    // Find ghost time at player position to calculate time delta
    const ghostFrameAtPlayerX = ghost.frames.find((f) => f.x >= playerX);
    if (ghostFrameAtPlayerX) {
      state.timeDelta = ghostFrameAtPlayerX.time - currentTime;
    }
  };

  const stop = (): void => {
    ghost = null;
    state.isPlaying = false;
  };

  const getGhostInfo = (): { name: string; distance: number } | null => {
    if (!ghost) return null;
    return {
      name: ghost.playerName,
      distance: ghost.distance,
    };
  };

  return {
    start,
    update,
    stop,
    getState: () => ({ ...state }),
    getGhostInfo,
  };
}

/**
 * Compress ghost run for storage
 */
export function compressGhostRun(ghost: GhostRun): string {
  // Simple compression: reduce precision and delta encode
  const compressed = {
    ...ghost,
    frames: ghost.frames.map((f, i, arr) => {
      if (i === 0) {
        return {
          t: Math.round(f.time),
          x: Math.round(f.x),
          y: Math.round(f.y),
          a: Math.round(f.angle * 100) / 100,
          b: f.isBoosting ? 1 : 0,
        };
      }
      // Delta encode from previous frame
      const prev = arr[i - 1];
      return {
        t: Math.round(f.time - prev.time),
        x: Math.round(f.x - prev.x),
        y: Math.round(f.y - prev.y),
        a: Math.round((f.angle - prev.angle) * 100) / 100,
        b: f.isBoosting ? 1 : 0,
      };
    }),
  };

  return JSON.stringify(compressed);
}

/**
 * Decompress ghost run from storage
 */
export function decompressGhostRun(compressed: string): GhostRun {
  const data = JSON.parse(compressed);

  let prevTime = 0;
  let prevX = 0;
  let prevY = 0;
  let prevAngle = 0;

  const frames: GhostFrame[] = data.frames.map(
    (f: { t: number; x: number; y: number; a: number; b: number }) => {
      const frame: GhostFrame = {
        time: prevTime + f.t,
        x: prevX + f.x,
        y: prevY + f.y,
        angle: prevAngle + f.a,
        isBoosting: f.b === 1,
      };

      prevTime = frame.time;
      prevX = frame.x;
      prevY = frame.y;
      prevAngle = frame.angle;

      return frame;
    }
  );

  return {
    ...data,
    frames,
  };
}

/**
 * Format time delta for display
 */
export function formatTimeDelta(deltaMs: number): string {
  const absDelta = Math.abs(deltaMs);
  const sign = deltaMs > 0 ? '+' : '-';
  const seconds = (absDelta / 1000).toFixed(1);
  return `${sign}${seconds}s`;
}
