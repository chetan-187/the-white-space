import { LineSegment } from '../canvas/canvas.types';

export type Segment = LineSegment;

export interface AiDrawRequest {
  prompt: string;
}

export type AiDrawStatus =
  | { status: 'generating' }
  | { status: 'done'; count: number }
  | { status: 'error'; message: string };
