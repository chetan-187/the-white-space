import express from 'express';
import cors from 'cors';
import { CanvasRepository } from './modules/canvas/canvas.repository';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/get-canvas-state', async (req, res) => {
  const canvasState = await CanvasRepository.getCanvasState();
  res.send({ canvasState });
});

export default app;
