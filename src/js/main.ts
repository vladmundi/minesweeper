import {tileConfig, presetDifficulties} from './config';
import {FlagType, IndicatorColors} from './constants';
import {FancyNumberDisplay} from './fancyNumberDisplay';
import {FlagGenerator} from './generators/flagGenerator';
import {MineGenerator} from './generators/mineGenerator';
import {EventWithTarget, Tile, GameConfig} from './types';


class Game {
  tiles: Array<Tile> = [];
  mines: Array<number> = [];
  world = document.getElementById('world');
  timerDisplay = document.getElementById('timer');
  countdownDisplay = document.getElementById('countdown');
  resetButton = document.getElementById('reset-button');
  smiley = document.getElementsByClassName('smiley')[0];
  timer = 0;
  countdown: number = 0;
  rightClickHandler = (e: EventWithTarget) => this.onRightClick(e);
  resetUpHandler = (e: Event) => this.onResetUp(e);
  resetDownHandler = (e: Event) => this.onResetDown(e);
  hoverHandler = (e: EventWithTarget) => this.hoverState(e);
  mouseDownHandler = (e: EventWithTarget) => this.onMouseDown(e);
  mouseUpHandler = (e: EventWithTarget) => this.onMouseUp(e);
  gameStarted = false;
  mineGenerator = new MineGenerator();
  flagGenerator = new FlagGenerator();
  countDownCtrl = new FancyNumberDisplay(this.countdownDisplay);
  timerCtrl = new FancyNumberDisplay(this.timerDisplay);
  timerInterval: number;
  startTime: number;
  mouseDown: boolean = false;
  currentTarget: Tile;
  previousTarget: Tile;
  gameConfig: GameConfig;

  constructor() {
    this.gameConfig = presetDifficulties.beginner;
    this.newGame();
  }

  onMouseDown(e: EventWithTarget) {
    if (e.button === 2) {
      this.rightClickHandler(e);
      return;
    }
    this.mouseDown = true;
    this.currentTarget = this.getTargetTile(e.target);
    if (this.currentTarget && this.currentTarget.flagged !== FlagType.FLAGGED && !this.currentTarget.open) {
      this.smiley.classList.add('anticipation');
      this.currentTarget.symbol.classList.remove('-closed');
    }
  }

  onMouseUp(e: EventWithTarget) {
    if (e.button === 2) {
      return;
    }
    this.mouseDown = false;
    this.previousTarget = undefined;
    this.smiley.classList.remove('anticipation');

    const clickedTile = this.getTargetTile(e.target);
    if (!clickedTile) return;

    // Game start
    if (!this.gameStarted) {
      this.startGame(this.tiles.indexOf(clickedTile));
      this.gameStarted = true;
    }

    // Game end
    if (clickedTile.armed && clickedTile.flagged !== FlagType.FLAGGED) {
      this.endGame(clickedTile);
      this.stopTimer();
      return;
    };

    this.openTile(clickedTile);
    this.checkGameState();
  }

  hoverState(e: EventWithTarget) {
    if (!this.mouseDown) return;

    this.previousTarget =
        !!this.currentTarget ? this.currentTarget : this.previousTarget;

    this.currentTarget = this.getTargetTile(e.target);

    if (this.currentTarget) {
      if (this.currentTarget.flagged !== FlagType.FLAGGED && !this.currentTarget.open) {
        this.smiley.classList.add('anticipation');
        this.currentTarget.symbol.classList.remove('-closed');
      } else {
        this.smiley.classList.remove('anticipation');
      }
    }

    if (this.currentTarget !== this.previousTarget && this.previousTarget &&
        !this.previousTarget.open) {
      this.previousTarget.symbol.classList.add('-closed');
    }
  }

  getTargetTile(target: HTMLElement): Tile {
    return this.tiles.find(tile => tile.symbol === target);
  }

  newGame() {
    this.countdown = this.gameConfig.mines;
    this.drawMap();
    this.initResetButton();
    this.setUpInteraction();
    this.updateCountdown();
    this.updateTimer();
    this.resize();
  }

  onResetDown(e: Event) {
    this.resetButton.classList.add('active');
  }

  onResetUp(e: Event) {
    this.world.innerHTML = '';
    this.stopTimer();
    this.timer = 0;
    this.updateTimer();
    this.tiles = [];
    this.mines = [];
    this.resetButton.classList.remove('active');
    this.smiley.classList.remove('dead');
    this.smiley.classList.remove('win');
    this.countdown = this.gameConfig.mines;
    this.gameStarted = false;
    this.newGame();
  }

  initResetButton() {
    this.resetButton.style.borderWidth = `${tileConfig.border}px`;
  }

  resize() {
    const gameWindow: HTMLElement = document.querySelector('.window');
    const docDimensions = {
      x: window.innerWidth,
      y: window.innerHeight,
    };
    const gameDimensions = {
      x: gameWindow.clientWidth,
      y: gameWindow.clientHeight,
    };
    const xr = 1 / (docDimensions.x / gameDimensions.x);
    const yr = 1 / (docDimensions.y / gameDimensions.y);

    if (docDimensions.x < gameDimensions.x ||
        docDimensions.y < gameDimensions.y) {
      if (xr > yr) {
        gameWindow.style.transform = `scale(${1 / xr - .05})`;
      } else {
        gameWindow.style.transform = `scale(${1 / yr - .05})`;
      }
    }
  }

  updateCountdown() {
    this.countDownCtrl.clear();
    this.countDownCtrl.show(this.countdown);
  }

  updateTimer() {
    this.timerCtrl.clear();
    this.timerCtrl.show(this.timer);
  }

  setUpInteraction() {
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    this.resetButton.addEventListener('mouseup', this.resetUpHandler);
    this.resetButton.addEventListener('mousedown', this.resetDownHandler);
    this.world.addEventListener('mouseover', this.hoverHandler);
    this.world.addEventListener('mousedown', this.mouseDownHandler);
    this.world.addEventListener('mouseup', this.mouseUpHandler);
  }

  startGame(clickedTileId: number) {
    this.setUpMines(clickedTileId);
    this.updateIndicators();
    this.startTimer();
  }

  startTimer() {
    this.timer = 0;
    this.startTime = new Date().getTime();
    this.timerInterval = setInterval(() => {
      this.timer = ~~((new Date().getTime() - this.startTime) / 1000);
      this.updateTimer();
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  checkGameState() {
    // Basically a win game scenario
    const armedTiles = this.tiles.filter(tile => tile.armed);
    const closedTiles = this.tiles.filter(tile => !tile.open);
    if (armedTiles.length === closedTiles.length) {
      armedTiles.forEach(tile => this.flagTile(tile, true));
      this.smiley.classList.add('win');
      this.removeInteraction();
      this.stopTimer();
    }
  }

  openTile(tile: Tile) {
    if (tile.open || tile.flagged === FlagType.FLAGGED) return;
    const idx = this.tiles.indexOf(tile);

    tile.symbol.innerHTML = '';
    tile.open = true;
    tile.symbol.classList.remove('-closed');

    if (tile.proximity) {
      tile.symbol.innerHTML = tile.proximity.toString();
      tile.symbol.style.color = IndicatorColors[tile.proximity - 1];
    } else {
      this.getAdjacentTiles(idx).forEach(tile => this.openTile(tile));
    }
  }

  onRightClick(e: EventWithTarget) {
    const clickedTile = this.getTargetTile(e.target);
    if (!clickedTile) return;

    this.flagTile(clickedTile);
  }

  flagTile(tile: Tile, forceFlag: boolean = false) {
    if (tile.open || forceFlag && tile.flagged === FlagType.FLAGGED) return;

    if (forceFlag && tile.flagged !== FlagType.FLAGGED) {
      tile.symbol.innerHTML = '';
      tile.symbol.appendChild(this.flagGenerator.dispatch());
      tile.flagged = FlagType.FLAGGED;
      this.countdown--;
      this.updateCountdown();
      return;
    }

    switch (tile.flagged) {
      case FlagType.NONE:
        tile.symbol.innerHTML = '';
        tile.symbol.appendChild(this.flagGenerator.dispatch());
        tile.flagged = FlagType.FLAGGED;
        this.countdown--;
        this.updateCountdown();
        break;

      case FlagType.FLAGGED:
        tile.symbol.innerHTML = '?';
        tile.flagged = FlagType.POSSIBLE;
        this.countdown++;
        this.updateCountdown();
        break;

      case FlagType.POSSIBLE:
        tile.symbol.innerHTML = '';
        tile.flagged = FlagType.NONE;
        break;
    }
  }

  drawMap() {
    const tileSize = tileConfig.size + tileConfig.border * 2 + tileConfig.gap;
    this.world.style.width = `${this.gameConfig.size.x * tileSize + tileConfig.gap}px`;
    this.world.style.height = `${this.gameConfig.size.y * tileSize + tileConfig.gap}px`;
    for (var i = 0, il = this.gameConfig.size.x * this.gameConfig.size.y; i < il; i++) {
      const tile = document.createElement('DIV');
      tile.classList.add('tile', '-closed');
      tile.id = `${i}`;

      tile.style.height = `${tileConfig.size}px`;
      tile.style.width = `${tileConfig.size}px`;
      tile.style.borderWidth = `${tileConfig.border}px`;

      tile.style.marginTop = `${tileConfig.gap}px`;
      tile.style.marginLeft = `${tileConfig.gap}px`;

      this.tiles.push({
        armed: false,
        flagged: FlagType.NONE,
        open: false,
        proximity: null,
        symbol: tile,
      });

      this.world.appendChild(tile);
    }
  }

  async setUpMines(clickedTileId: number) {
    const nonArmedTileIds: Array<number> =
        this.getAdjacentTiles(clickedTileId)
            .map(tile => parseInt(tile.symbol.id));
    while (this.mines.length < this.gameConfig.mines) {
      let place = Math.floor(Math.random() * this.gameConfig.size.x * this.gameConfig.size.y);

      if (this.tiles[place].armed || place === clickedTileId) continue;
      if (nonArmedTileIds.includes(place)) {
        continue;
      }

      this.tiles[place].armed = true;
      this.mines.push(place);
    }
  }

  updateIndicators() {
    for (var i = 0, il = this.gameConfig.size.x * this.gameConfig.size.y; i < il; i++) {
      const iteratedTile = this.tiles[i];

      this.getAdjacentTiles(i).forEach(tile => {
        if (tile.armed && !iteratedTile.armed) {
          iteratedTile.proximity++;
        }
      });
    }
  }

  endGame(tile: Tile) {
    tile.symbol.style.background = 'red';

    this.smiley.classList.add('dead');

    this.tiles.forEach(tile => {
      const nonMarked = tile.armed && tile.flagged !== FlagType.FLAGGED;
      const wronglyMarked = !tile.armed && tile.flagged === FlagType.FLAGGED;
      if (nonMarked || wronglyMarked) {
        tile.symbol.innerHTML = '';
        tile.symbol.classList.remove('-closed');
        tile.symbol.appendChild(this.mineGenerator.dispatch());

        if (wronglyMarked) tile.symbol.classList.add('-cross');
      }
    });

    this.removeInteraction();
    // alert('Game over');
  }

  removeInteraction() {
    this.world.removeEventListener('mousedown', this.mouseDownHandler);
    this.world.removeEventListener('mouseup', this.mouseUpHandler);
    this.world.removeEventListener('contextmenu', this.rightClickHandler);
  }

  getAdjacentTiles(id: number) {
    // Top tiles
    const topTiles = [
      id % this.gameConfig.size.x ? this.tiles[id - this.gameConfig.size.x - 1] : undefined,
      this.tiles[id - this.gameConfig.size.x],
      (id + 1) % this.gameConfig.size.x ? this.tiles[id - this.gameConfig.size.x + 1] : undefined,
    ];

    const sideTiles = [
      id % this.gameConfig.size.x ? this.tiles[id - 1] : undefined,
      (id + 1) % this.gameConfig.size.x ? this.tiles[id + 1] : undefined,
    ];

    const bottomTiles = [
      id % this.gameConfig.size.x ? this.tiles[id + this.gameConfig.size.x - 1] : undefined,
      this.tiles[id + this.gameConfig.size.x],
      (id + 1) % this.gameConfig.size.x ? this.tiles[id + this.gameConfig.size.x + 1] : undefined,
    ];

    return [...topTiles, ...sideTiles, ...bottomTiles].filter(a => a);
  }
};

(() => {
  new Game();
})();