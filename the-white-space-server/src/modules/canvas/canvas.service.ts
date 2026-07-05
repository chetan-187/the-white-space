import { CanvasRepository } from './canvas.repository';
import { CanvasUpdate, LineSegment } from './canvas.types';

export const CanvasService = {
  async getCanvas() {
    return await CanvasRepository.getCanvasState();
  },

  async saveUpdate(update: CanvasUpdate) {
    await CanvasRepository.saveCanvasState(update);
    return update;
  },

  async saveUpdates(updates: LineSegment[]) {
    await CanvasRepository.saveCanvasStates(updates);
    return updates;
  },

  async clearCanvas() {
    return await CanvasRepository.clearCanvas();
  }
};
