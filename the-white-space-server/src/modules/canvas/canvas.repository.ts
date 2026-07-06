import redis from '../../config/redis';
import { CanvasStateItem, CanvasUpdate, LineSegment } from './canvas.types';

// Redis LIST of JSON-encoded segments. Appends (RPUSH) are atomic, so
// concurrent draw events can never overwrite each other — unlike the previous
// read-modify-write of one big JSON array, which lost segments under the
// network latency of hosted Redis.
const CANVAS_KEY = 'canvasSegments';

export const CanvasRepository = {
  async getCanvasState(): Promise<CanvasStateItem[]> {
    const items = await redis.lRange(CANVAS_KEY, 0, -1);
    const state: CanvasStateItem[] = [];
    for (const item of items) {
      try {
        state.push(JSON.parse(item));
      } catch {
        // Skip corrupt entries rather than failing the whole canvas
      }
    }
    return state;
  },

  async saveCanvasState(update: CanvasUpdate): Promise<void> {
    await redis.rPush(CANVAS_KEY, JSON.stringify(update));
  },

  async saveCanvasStates(updates: LineSegment[]): Promise<void> {
    if (updates.length === 0) return;
    await redis.rPush(CANVAS_KEY, updates.map((u) => JSON.stringify(u)));
  },

  async clearCanvas(): Promise<void> {
    await redis.del(CANVAS_KEY);
  },
};
