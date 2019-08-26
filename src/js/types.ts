export interface EventWithTarget extends Event {
  target: HTMLElement;
}

export interface Tile {
  armed: boolean;
  flagged: number;
  open: boolean;
  proximity: number;
  symbol: HTMLElement;
}
