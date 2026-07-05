export interface CanvasUpdate {
    userId: string;
    data: any;
  }

// Shape actually stored in Redis and rendered by the frontend
export interface LineSegment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    tool?: 'pen' | 'eraser';
  }

export type CanvasStateItem = CanvasUpdate | LineSegment;
