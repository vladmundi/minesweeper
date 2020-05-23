export interface EventWithTarget extends MouseEvent {
  target: HTMLElement;
}

export interface Tile {
  armed: boolean;
  flagged: number;
  open: boolean;
  proximity: number;
  symbol: HTMLElement;
}
