/**
 * Dashes are represented by numbers in following fashion: 
 * 1 - top left
 * 2 - bottom left
 * 3 - top
 * 4 - middle
 * 5 - bottom
 * 6 - top right
 * 7 - bottom right
 */
export const FancyNumbers = [
  [1, 2, 3, 5, 6, 7], // Number 0
  [6, 7], // Number 1
  [2, 3, 4, 5, 6], // Number 2
  [3, 4, 5, 6, 7], // Number 3
  [1, 4, 6, 7], // Number 4
  [1, 3, 4, 5, 7], // Number 5
  [1, 2, 3, 4, 5, 7], // Number 6
  [3, 6, 7], // Number 7
  [1, 2, 3, 4, 5, 6, 7], // Number 8
  [1, 3, 4, 5, 6, 7], // Number 9
  [4], // Minus sign -
];

export const IndicatorColors = [
  'blue',
  'green',
  'red',
  'dark blue',
  'brown',
  'cyan',
  'black',
  'grey',
];

export const FlagType = {
  NONE: 0,
  FLAGGED: 1,
  POSSIBLE: 2, // Question mark
};

export const MouseButton = {
  LEFT: 0, // Main button pressed, usually the left button or the un-initialized state
  MIDDLE: 1, // Auxiliary button pressed, usually the wheel button or the middle button (if present)
  RIGHT: 2, // Secondary button pressed, usually the right button
}