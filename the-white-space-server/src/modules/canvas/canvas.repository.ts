import redis from '../../config/redis';
import { CanvasStateItem, CanvasUpdate, LineSegment } from './canvas.types';

const CANVAS_KEY = 'canvasState';

export const CanvasRepository = {
  async getCanvasState(): Promise<CanvasStateItem[]> {
    const data = await redis.get(CANVAS_KEY);
    return data ? JSON.parse(data) : [];
  },

  async saveCanvasState(update: CanvasUpdate): Promise<void> {
    const canvasState = await CanvasRepository.getCanvasState();
    canvasState.push(update);
    await redis.set(CANVAS_KEY, JSON.stringify(canvasState));
  },

  async saveCanvasStates(updates: LineSegment[]): Promise<void> {
    const canvasState = await CanvasRepository.getCanvasState();
    canvasState.push(...updates);
    await redis.set(CANVAS_KEY, JSON.stringify(canvasState));
  },

  async clearCanvas(): Promise<void> {
    await redis.del(CANVAS_KEY);
  },
};
