export type Tool = 'draw' | 'text' | 'erase';


export interface DrawAction {
    type: 'draw';
    color?: string;
    lineWidth?: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }
  
  export interface EraseAction {
    type: 'erase';
    lineWidth?: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }
  
  export interface TextAction {
    type: 'text';
    text: string;
    color?: string;
    x: number;
    y: number;
  }
  
  export type Action = DrawAction | EraseAction | TextAction;
  