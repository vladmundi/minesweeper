import { tileConfig, presetDifficulties } from "./config";
import { FlagType, IndicatorColors, MouseButton } from "./constants";
import { FancyNumberDisplay } from "./fancyNumberDisplay";
import { FlagGenerator } from "./generators/flagGenerator";
import { MineGenerator } from "./generators/mineGenerator";
import { EventWithTarget, Tile, GameConfig } from "./types";
import { SideMenu } from "./sideMenu";
// import '../html/tile.html';

class Game {
  // Game element arrays
  tiles: Array<Tile> = [];
  mines: Array<number> = [];

  // Markup references
  world = document.getElementById("world");
  timerDisplay = document.getElementById("timer");
  countdownDisplay = document.getElementById("countdown");
  resetButton = document.getElementById("reset-button");
  smiley = document.getElementsByClassName("smiley")[0];

  // Generators
  mineGenerator = new MineGenerator();
  flagGenerator = new FlagGenerator();

  // Numeric display controls
  countDownCtrl = new FancyNumberDisplay(this.countdownDisplay);
  timerCtrl = new FancyNumberDisplay(this.timerDisplay);

  // Game state values
  timer = 0;
  countdown = 0;
  gameStarted = false;
  timerInterval: number;
  startTime: number;
  middleDown = false;
  leftDown = false;
  rightDown = false;
  resetDown = false;
  currentTarget: Tile;
  previousTarget: Tile;
  gameConfig: GameConfig;
  gameReady = false;

  // Intermediate states
  tempRevealedTiles: Array<Tile> = [];
  adjascentTiles: Array<Tile> = [];

  // Classes
  sideMenu: SideMenu;

  constructor() {
    this.gameConfig = presetDifficulties.beginner;
    this.resetButton.style.borderWidth = `${tileConfig.border}px`;
    this.sideMenu = new SideMenu();
    this.setUpInteraction();
    this.newGame();
    this.resize();
  }

  onMouseDown(e: EventWithTarget) {
    if (!this.gameReady) return;

    switch (e.button) {
      case MouseButton.LEFT:
        this.leftDown = true;
        if (!this.middleDown && !this.rightDown) this.onLeftMouseDown(e);
        break;

      case MouseButton.MIDDLE:
        this.onMiddleMouseDown(e);
        break;

      case MouseButton.RIGHT:
        this.rightDown = true;
        if (!this.middleDown && !this.leftDown) this.onRightMouseDown(e);
        break;

      default:
        return;
    }

    if (this.leftDown && this.rightDown) {
      this.onMiddleMouseDown(e);
    }
  }

  onMouseUp(e: EventWithTarget) {
    if (!this.gameReady) return;

    switch (e.button) {
      case MouseButton.LEFT:
        if (!this.middleDown && !this.rightDown) this.onLeftMouseUp(e);
        if (this.rightDown) this.onMiddleMouseUp(e);
        break;

      case MouseButton.MIDDLE:
        this.onMiddleMouseUp(e);
        break;

      case MouseButton.RIGHT:
        if (this.leftDown) this.onMiddleMouseUp(e);
        break;

      default:
        return;
    }

    // meh
    setTimeout(() => (this.rightDown = false), 50);
    this.leftDown = false;
    this.middleDown = false;
  }

  onMouseOver(e: EventWithTarget) {
    if (this.leftDown && !this.rightDown) this.onLeftMouseOver(e);
    if (this.middleDown || (this.leftDown && this.rightDown))
      this.onMiddleMouseOver(e);
    // if (this.rightDown && !this.leftDown)
  }

  onMiddleMouseOver(e: EventWithTarget) {
    if (!this.middleDown) return; // Gotta love them race conditions...
    this.currentTarget = this.getTargetTile(e.target);
    const idx = this.tiles.indexOf(this.currentTarget);

    // unreveal tiles
    this.tempRevealedTiles.forEach((tile) =>
      tile.symbol.classList.add("-closed")
    );

    // Store current adjascentTiles references
    this.adjascentTiles = this.getAdjacentTiles(idx);

    // get potentially temporary revealed tiles
    const revealTiles = [...this.adjascentTiles, this.currentTarget];

    // filter out the non qualified for temporary reveal tiles
    this.tempRevealedTiles = revealTiles.filter(
      (tile) => !tile.open && tile.flagged != FlagType.FLAGGED
    );
    // reveal em!
    this.tempRevealedTiles.forEach((tile) =>
      tile.symbol.classList.remove("-closed")
    );

    if (this.tempRevealedTiles.length) {
      this.smiley.classList.add("anticipation");
    } else {
      this.smiley.classList.remove("anticipation");
    }
  }

  onLeftMouseOver(e: EventWithTarget) {
    this.previousTarget = !!this.currentTarget
      ? this.currentTarget
      : this.previousTarget;

    this.currentTarget = this.getTargetTile(e.target);

    if (this.currentTarget) {
      if (
        this.currentTarget.flagged !== FlagType.FLAGGED &&
        !this.currentTarget.open
      ) {
        this.smiley.classList.add("anticipation");
        this.currentTarget.symbol.classList.remove("-closed");
      } else {
        this.smiley.classList.remove("anticipation");
      }
    }

    if (
      this.currentTarget !== this.previousTarget &&
      this.previousTarget &&
      !this.previousTarget.open
    ) {
      this.previousTarget.symbol.classList.add("-closed");
    }
  }

  onMiddleMouseUp(e: EventWithTarget) {
    this.middleDown = false;
    const target = this.getTargetTile(e.target);
    if (target && target.open && target.proximity) {
      // amount of tiles that are in proximity and flagged
      const flaggedTilesAmount = this.adjascentTiles.filter(
        (tile) => tile.flagged === FlagType.FLAGGED
      ).length;
      if (flaggedTilesAmount === target.proximity) {
        this.adjascentTiles.forEach((tile) => this.tileClick(tile));
        this.smiley.classList.remove("anticipation");
        return;
      }
    }
    this.tempRevealedTiles.forEach((tile) =>
      tile.symbol.classList.add("-closed")
    );
    this.smiley.classList.remove("anticipation");
  }

  onMiddleMouseDown(e: EventWithTarget) {
    this.middleDown = true;
    this.currentTarget = this.getTargetTile(e.target);
    const idx = this.tiles.indexOf(this.currentTarget);

    // Store current adjascentTiles references
    this.adjascentTiles = this.getAdjacentTiles(idx);

    // get potentially temporary revealed tiles
    const revealTiles = [...this.adjascentTiles, this.currentTarget];

    // filter out the non qualified for temporary reveal tiles
    this.tempRevealedTiles = revealTiles.filter(
      (tile) => !tile.open && tile.flagged != FlagType.FLAGGED
    );
    // reveal em!
    this.tempRevealedTiles.forEach((tile) =>
      tile.symbol.classList.remove("-closed")
    );

    if (this.tempRevealedTiles.length) {
      this.smiley.classList.add("anticipation");
    }
  }

  onLeftMouseDown(e: EventWithTarget) {
    this.currentTarget = this.getTargetTile(e.target);
    if (
      this.currentTarget &&
      this.currentTarget.flagged !== FlagType.FLAGGED &&
      !this.currentTarget.open
    ) {
      this.smiley.classList.add("anticipation");
      this.currentTarget.symbol.classList.remove("-closed");
    }
  }

  onLeftMouseUp(e: EventWithTarget) {
    const clickedTile = this.getTargetTile(e.target);
    if (!clickedTile) {
      if (e.target === this.resetButton) {
        this.onResetUp();
      } else if (this.resetDown) {
        this.resetDown = false;
      }
      this.smiley.classList.remove("anticipation");
      if (this.currentTarget && !this.currentTarget.open)
        this.currentTarget.symbol.classList.add("-closed");
    } else {
      this.tileClick(clickedTile);
    }
  }

  tileClick(clickedTile: Tile) {
    if (!this.gameReady) return;

    this.previousTarget = undefined;
    this.smiley.classList.remove("anticipation");

    // Game start
    if (!this.gameStarted) {
      this.startGame(this.tiles.indexOf(clickedTile));
      this.gameStarted = true;
    }

    // Game end
    if (clickedTile.armed && clickedTile.flagged !== FlagType.FLAGGED) {
      this.endGame(clickedTile);
      return;
    }

    this.openTile(clickedTile);
    this.checkGameState();
  }

  getTargetTile(target: HTMLElement): Tile {
    return this.tiles.find((tile) => tile.symbol === target);
  }

  newGame() {
    this.countdown = this.gameConfig.mines;
    this.drawMap();
    this.updateCountdown();
    this.updateTimer();
    this.gameReady = true;
  }

  onResetDown(e: MouseEvent) {
    if (e.button === MouseButton.RIGHT) return;
    this.resetDown = true;
    this.resetButton.classList.add("active");
  }

  onResetOver() {
    if (this.resetDown) {
      this.resetButton.classList.add("active");
    }
  }

  onResetUp() {
    if (!this.resetDown) return;
    this.resetDown = false;
    this.resetGame();
    this.newGame();
  }

  resetGame() {
    this.world.innerHTML = "";
    this.stopTimer();
    this.timer = 0;
    this.updateTimer();
    this.tiles = [];
    this.mines = [];
    this.resetButton.classList.remove("active");
    this.smiley.classList.remove("dead");
    this.smiley.classList.remove("win");
    this.countdown = this.gameConfig.mines;
    this.gameStarted = false;
  }

  resize() {
    const gameWindow: HTMLElement = document.querySelector(".window");
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

    if (
      docDimensions.x < gameDimensions.x ||
      docDimensions.y < gameDimensions.y
    ) {
      if (xr > yr) {
        gameWindow.style.transform = `scale(${1 / xr - 0.05})`;
      } else {
        gameWindow.style.transform = `scale(${1 / yr - 0.05})`;
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
    const window = document.querySelector(".window");
    window.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("mousedown", (e: MouseEvent) => {
      if (e.button === MouseButton.MIDDLE) {
        e.preventDefault();
      }
    });

    // Reset button interaction
    this.resetButton.addEventListener("mousedown", (e: MouseEvent) =>
      this.onResetDown(e)
    );
    this.resetButton.addEventListener("mouseleave", () =>
      this.resetButton.classList.remove("active")
    );
    this.resetButton.addEventListener("mouseover", () => this.onResetOver());
    this.resetButton.addEventListener("mouseup", () => this.onResetUp());

    this.world.addEventListener("mouseover", (e: EventWithTarget) =>
      this.onMouseOver(e)
    );
    this.world.addEventListener("mousedown", (e: EventWithTarget) =>
      this.onMouseDown(e)
    );
    document.body.addEventListener("mouseup", (e: EventWithTarget) =>
      this.onMouseUp(e)
    );
  }

  startGame(clickedTileId: number) {
    this.setUpMines(clickedTileId);
    this.updateIndicators();
    this.startTimer();
  }

  startTimer() {
    const ms = 1000;
    this.timer = 0;
    this.startTime = new Date().getTime();
    this.timerInterval = setInterval(() => {
      this.timer = Math.floor((new Date().getTime() - this.startTime) / ms);
      if (this.timer >= ms) {
        clearInterval(this.timerInterval);
        return;
      }
      this.updateTimer();
    }, ms);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  checkGameState() {
    // Basically a win game scenario
    const armedTiles = this.tiles.filter((tile) => tile.armed);
    const closedTiles = this.tiles.filter((tile) => !tile.open);
    if (armedTiles.length === closedTiles.length) {
      armedTiles.forEach((tile) => this.flagTile(tile, true));
      this.smiley.classList.add("win");
      this.stopTimer();
      this.gameReady = false;
    }
  }

  openTile(tile: Tile) {
    if (tile.open || tile.flagged === FlagType.FLAGGED) return;
    const idx = this.tiles.indexOf(tile);

    tile.open = true;
    tile.symbol.classList.remove("-closed");

    if (tile.proximity) {
      tile.symbol.innerHTML = tile.proximity.toString();
      tile.symbol.style.color = IndicatorColors[tile.proximity - 1];
    } else {
      tile.symbol.innerHTML = "";
      this.getAdjacentTiles(idx).forEach((tile) => this.openTile(tile));
    }
  }

  onRightMouseDown(e: EventWithTarget) {
    const clickedTile = this.getTargetTile(e.target);
    if (!clickedTile) return;

    this.flagTile(clickedTile);
  }

  flagTile(tile: Tile, forceFlag: boolean = false) {
    if (tile.open || (forceFlag && tile.flagged === FlagType.FLAGGED)) return;

    if (forceFlag && tile.flagged !== FlagType.FLAGGED) {
      tile.symbol.innerHTML = "";
      tile.symbol.appendChild(this.flagGenerator.dispatch());
      tile.flagged = FlagType.FLAGGED;
      this.countdown--;
      this.updateCountdown();
      return;
    }

    switch (tile.flagged) {
      case FlagType.NONE:
        tile.symbol.innerHTML = "";
        tile.symbol.appendChild(this.flagGenerator.dispatch());
        tile.flagged = FlagType.FLAGGED;
        this.countdown--;
        this.updateCountdown();
        break;

      case FlagType.FLAGGED:
        tile.symbol.innerHTML = "?";
        tile.flagged = FlagType.POSSIBLE;
        this.countdown++;
        this.updateCountdown();
        break;

      case FlagType.POSSIBLE:
        tile.symbol.innerHTML = "";
        tile.flagged = FlagType.NONE;
        break;
    }
  }

  drawMap() {
    const tileSize = tileConfig.size + tileConfig.border * 2 + tileConfig.gap;
    this.world.style.width = `${
      this.gameConfig.size.x * tileSize + tileConfig.gap
    }px`;
    this.world.style.height = `${
      this.gameConfig.size.y * tileSize + tileConfig.gap
    }px`;
    for (
      var i = 0, il = this.gameConfig.size.x * this.gameConfig.size.y;
      i < il;
      i++
    ) {
      const tile = document.createElement("DIV");
      tile.classList.add("tile", "-closed");
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
    const nonArmedTileIds: Array<number> = this.getAdjacentTiles(
      clickedTileId
    ).map((tile) => parseInt(tile.symbol.id));
    while (this.mines.length < this.gameConfig.mines) {
      let place = Math.floor(
        Math.random() * this.gameConfig.size.x * this.gameConfig.size.y
      );

      if (this.tiles[place].armed || place === clickedTileId) continue;
      if (nonArmedTileIds.includes(place)) {
        continue;
      }

      this.tiles[place].armed = true;
      this.mines.push(place);
    }
  }

  updateIndicators() {
    for (
      var i = 0, il = this.gameConfig.size.x * this.gameConfig.size.y;
      i < il;
      i++
    ) {
      const iteratedTile = this.tiles[i];

      this.getAdjacentTiles(i).forEach((tile) => {
        if (tile.armed && !iteratedTile.armed) {
          iteratedTile.proximity++;
        }
      });
    }
  }

  endGame(tile: Tile) {
    tile.symbol.style.background = "red";

    this.smiley.classList.add("dead");

    this.tiles.forEach((tile) => {
      const nonMarked = tile.armed && tile.flagged !== FlagType.FLAGGED;
      const wronglyMarked = !tile.armed && tile.flagged === FlagType.FLAGGED;
      if (nonMarked || wronglyMarked) {
        tile.symbol.innerHTML = "";
        tile.symbol.classList.remove("-closed");
        tile.symbol.appendChild(this.mineGenerator.dispatch());

        if (wronglyMarked) tile.symbol.classList.add("-cross");
      }
    });

    this.stopTimer();
    this.gameReady = false;
  }

  getAdjacentTiles(id: number) {
    // Top tiles
    const topTiles = [
      id % this.gameConfig.size.x
        ? this.tiles[id - this.gameConfig.size.x - 1]
        : undefined,
      this.tiles[id - this.gameConfig.size.x],
      (id + 1) % this.gameConfig.size.x
        ? this.tiles[id - this.gameConfig.size.x + 1]
        : undefined,
    ];

    const sideTiles = [
      id % this.gameConfig.size.x ? this.tiles[id - 1] : undefined,
      (id + 1) % this.gameConfig.size.x ? this.tiles[id + 1] : undefined,
    ];

    const bottomTiles = [
      id % this.gameConfig.size.x
        ? this.tiles[id + this.gameConfig.size.x - 1]
        : undefined,
      this.tiles[id + this.gameConfig.size.x],
      (id + 1) % this.gameConfig.size.x
        ? this.tiles[id + this.gameConfig.size.x + 1]
        : undefined,
    ];

    return [...topTiles, ...sideTiles, ...bottomTiles].filter((a) => a);
  }
}

(() => {
  new Game();
})();
