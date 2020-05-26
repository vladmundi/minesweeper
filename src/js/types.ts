// Hackish way of having a target as a HTMLElement rather than EventTarget
export interface EventWithTarget extends MouseEvent {
  target: HTMLElement;
}

// Tile model
export interface Tile {
  armed: boolean;
  flagged: number;
  open: boolean;
  proximity: number;
  symbol: HTMLElement;
}

// Configurable difficulty of the game
export interface GameConfig {
  size: {
    x: number;
    y: number;
  };
  mines: number;
}