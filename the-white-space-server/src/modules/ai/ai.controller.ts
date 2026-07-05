import { Server, Socket } from 'socket.io';
import { AiService } from './ai.service';
import { CanvasService } from '../canvas/canvas.service';
import { AiDrawRequest } from './ai.types';

export const AiController = (socket: Socket, io: Server) => {
  socket.on('ai-draw', async (request: AiDrawRequest) => {
    const prompt = request?.prompt?.trim();

    if (!prompt) {
      socket.emit('ai-draw-status', { status: 'error', message: 'Prompt is empty.' });
      return;
    }

    try {
      socket.emit('ai-draw-status', { status: 'generating' });

      const segments = await AiService.generateDrawing(prompt);

      await CanvasService.saveUpdates(segments);
      segments.forEach((segment) => io.emit('draw', segment));

      socket.emit('ai-draw-status', { status: 'done', count: segments.length });
    } catch (error) {
      console.error('AI draw failed:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to generate the drawing.';
      socket.emit('ai-draw-status', { status: 'error', message });
    }
  });
};
