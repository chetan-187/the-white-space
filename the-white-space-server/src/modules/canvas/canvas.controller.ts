import { Socket } from 'socket.io';
import { CanvasService } from './canvas.service';
import { CanvasUpdate } from './canvas.types';

export const CanvasController = (socket: Socket, io: any) => {
  socket.on('draw', async (update: CanvasUpdate) => {
    const savedUpdate = await CanvasService.saveUpdate(update);
    io.emit('draw', savedUpdate);
  });

  socket.on('clear-canvas', async () => {
    await CanvasService.clearCanvas();
    io.emit('canvas-cleared');
  });
};
