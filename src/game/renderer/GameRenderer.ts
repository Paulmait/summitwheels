/**
 * Game Renderer - Transforms physics bodies to renderable data
 * Uses a data-driven approach compatible with React Native
 */

import Matter from 'matter-js';
import { Car } from '../physics/car';
import { TerrainSegment } from '../terrain/terrain';

export type RenderableBody = {
  id: number;
  type: 'rectangle' | 'circle' | 'polygon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  angle: number;
  vertices?: { x: number; y: number }[];
  label: string;
  color: string;
};

export type RenderState = {
  bodies: RenderableBody[];
  cameraX: number;
  cameraY: number;
};

export type CameraConfig = {
  /** Follow offset X (car position from left edge) */
  followOffsetX: number;
  /** Screen width */
  screenWidth: number;
  /** Screen height */
  screenHeight: number;
  /** Vertical center offset */
  verticalOffset: number;
};

const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  followOffsetX: 150, // Car at left-third of screen
  screenWidth: 400,
  screenHeight: 600,
  verticalOffset: 0,
};

/**
 * Get color based on body label
 */
function getBodyColor(label: string): string {
  switch (label) {
    case 'carBody':
      return '#FF6B35'; // Orange
    case 'frontWheel':
    case 'rearWheel':
      return '#333333'; // Dark gray
    case 'ground':
    case 'flatGround':
      return '#4A7023'; // Green
    case 'coin':
      return '#FFD700'; // Gold
    case 'fuel':
      return '#FF4444'; // Red
    default:
      return '#888888'; // Gray
  }
}

/**
 * Convert Matter.js body to renderable format
 */
function bodyToRenderable(body: Matter.Body): RenderableBody {
  const bounds = body.bounds;
  const width = bounds.max.x - bounds.min.x;
  const height = bounds.max.y - bounds.min.y;

  // Detect circle by checking if it has circleRadius
  const isCircle = (body as any).circleRadius !== undefined;

  if (isCircle) {
    return {
      id: body.id,
      type: 'circle',
      x: body.position.x,
      y: body.position.y,
      radius: (body as any).circleRadius,
      angle: body.angle,
      label: body.label,
      color: getBodyColor(body.label),
    };
  }

  // Check if it's a complex polygon
  if (body.vertices.length > 4) {
    return {
      id: body.id,
      type: 'polygon',
      x: body.position.x,
      y: body.position.y,
      vertices: body.vertices.map((v) => ({ x: v.x, y: v.y })),
      angle: body.angle,
      label: body.label,
      color: getBodyColor(body.label),
    };
  }

  // Default to rectangle
  return {
    id: body.id,
    type: 'rectangle',
    x: body.position.x,
    y: body.position.y,
    width,
    height,
    angle: body.angle,
    label: body.label,
    color: getBodyColor(body.label),
  };
}

/**
 * Calculate camera position to follow the car
 */
export function calculateCamera(
  car: Car,
  config: Partial<CameraConfig> = {}
): { x: number; y: number } {
  const cfg = { ...DEFAULT_CAMERA_CONFIG, ...config };
  const carPos = car.getPosition();

  return {
    x: carPos.x - cfg.followOffsetX,
    y: Math.max(0, carPos.y - cfg.screenHeight / 2 + cfg.verticalOffset),
  };
}

/**
 * Create render state from physics world
 */
export function createRenderState(
  bodies: Matter.Body[],
  cameraX: number,
  cameraY: number
): RenderState {
  return {
    bodies: bodies.map(bodyToRenderable),
    cameraX,
    cameraY,
  };
}

/**
 * Transform world coordinates to screen coordinates
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  cameraX: number,
  cameraY: number
): { x: number; y: number } {
  return {
    x: worldX - cameraX,
    y: worldY - cameraY,
  };
}

/**
 * Check if a body is visible on screen
 */
export function isBodyVisible(
  body: RenderableBody,
  cameraX: number,
  cameraY: number,
  screenWidth: number,
  screenHeight: number,
  margin: number = 100
): boolean {
  const screenPos = worldToScreen(body.x, body.y, cameraX, cameraY);
  const size = body.radius ?? Math.max(body.width ?? 0, body.height ?? 0);

  return (
    screenPos.x + size > -margin &&
    screenPos.x - size < screenWidth + margin &&
    screenPos.y + size > -margin &&
    screenPos.y - size < screenHeight + margin
  );
}
