const config = {
  size: {
    x: 10,
    y: 10,
  },
  tileGap: 4,
  mines: 10,
  tileBorder: 7,
  tileSize: 50,
};

const FancyNumberConfig = [
  [1, 2, 3, 5, 6, 7],
  [6, 7],
  [2, 3, 4, 5, 6],
  [3, 4, 5, 6, 7],
  [1, 4, 6, 7],
  [1, 3, 4, 5, 7],
  [1, 2, 3, 4, 5, 7],
  [3, 6, 7],
  [1, 2, 3, 4, 5, 6, 7],
  [1, 3, 4, 5, 6, 7],
  [4],
];

const Constants = {
  IndicatorColors: [
    'blue',
    'green',
    'red',
    'dark blue',
    'brown',
    'cyan',
    'black',
    'grey',
  ]
};

const FlagType = {
  NONE: 0,
  FLAGGED: 1,
  POSSIBLE: 2,
};

class Generator {
  item;
  constructor() {
    this.item = this.createItem();
  }

  createItem() {}

  dispatch() {
    return this.item.cloneNode(true);
  }
};

class MineGenerator extends Generator {
  createItem() {
    const mine = document.createElement('div');
    mine.classList.add('mine');
    const mineCrossSpikes = document.createElement('div');
    mineCrossSpikes.classList.add('mine-cross-spikes');
    mine.appendChild(mineCrossSpikes);
    const mineHighlight = document.createElement('div');
    mineHighlight.classList.add('mine-highlight');
    mine.appendChild(mineHighlight);
    return mine;
  }
};

class FlagGenerator extends Generator {
  createItem() {
    const flag = document.createElement('div');
    flag.classList.add('flag');
    return flag;
  }
};

class NumberDisplayGenerator extends Generator {
  createNumber() {
    const digit = document.createElement('div');
    digit.classList.add('digit');
    for (let i = 1, il = 7; i <= il; i++) {
      const el = document.createElement('div');
      el.classList.add('dash', `dash-${i}`);
      digit.appendChild(el);
    }
    return digit;
  }
};

class FancyNumberDisplay extends NumberDisplayGenerator {
  display;

  constructor(display) {
    super();
    this.display = display;
    this.createDisplay();
  }

  createDisplay() {
    for (let i = 0; i < 3; i++) {
      this.display.appendChild(this.createNumber());
    }
  }

  clear() {
    const digits = this.display.children;
    for (let i = 0; i < digits.length; i++) {
      const dashes = digits[i].children;
      for (let j = 0; j < dashes.length; j++) {
        dashes[j].classList.remove('lit');
      }
    }
  }

  show(num) {
    const str = [...num.toString()].reverse();
    console.log(str);
    for (let i = 0; i < str.length; i++) {
      const char = str[i] === '-' ? '10' : str[i];
      console.log(char, i);
      const fancyConfig = FancyNumberConfig[char];
      console.log(fancyConfig);
      fancyConfig.forEach(dash => {
        this.display.children[2 - i].children[dash - 1].classList.add('lit');
      });
    }
  }
}

class Game {
  tiles = [];
  mines = [];
  world = document.getElementById('world');
  timerDisplay = document.getElementById('timer');
  countdownDisplay = document.getElementById('countdown');
  timer = 0;
  countdown = config.mines;
  clickHandler = (e) => this.onClick(e);
  rightClickHandler = (e) => this.onRightClick(e);
  gameStarted = false;
  mineGenerator = new MineGenerator();
  flagGenerator = new FlagGenerator();
  countDownCtrl = new FancyNumberDisplay(this.countdownDisplay);
  timerCtrl = new FancyNumberDisplay(this.timerDisplay);
  timerTimeout;
  startTime;

  constructor() {
    this.drawMap();
    this.setUpInteraction();
    this.updateCountdown();
    this.updateTimer();
    this.resize();
  }

  resize() {
    const gameWindow = document.querySelector('.window');
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

    console.log(xr, yr);

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
    console.log(this.countdown);
    this.countDownCtrl.clear();
    this.countDownCtrl.show(this.countdown);
  }

  updateTimer() {
    this.timerCtrl.clear();
    this.timerCtrl.show(this.timer);
  }

  setUpInteraction() {
    window.addEventListener('click', this.clickHandler);
    window.addEventListener('contextmenu', this.rightClickHandler, false);
  }

  startGame(clickedTileId) {
    this.setUpMines(clickedTileId);
    this.updateIndicators();
    this.startTimer();
  }

  startTimer() {
    this.startTime = new Date().getTime();
    console.log(this.startTime);
    this.timerTimeout = setInterval(() => {
      this.timer = ~~((new Date().getTime() - this.startTime) / 1000);
      console.log(this.timer);
      this.updateTimer();
      console.log('tick tok');
    }, 1000);
  }

  onClick(e) {
    console.log('click', e.target);
    const id = parseInt(e.target.id);
    if (!id && id !== 0) return;

    // Game start
    if (!this.gameStarted) {
      this.startGame(id);
      this.gameStarted = true;
    }

    const tile = this.tiles[id];

    // Game end
    if (tile.armed && tile.flagged !== FlagType.FLAGGED) {
      this.endGame(tile);
      return;
    };

    this.openTile(tile);
  }

  openTile(tile) {
    if (tile.open || tile.flagged === FlagType.FLAGGED) return;

    tile.symbol.innerHTML = '';
    tile.open = true;
    tile.symbol.classList.remove('-closed');
    // console.log('opened a tile', tile);

    if (tile.proximity) {
      tile.symbol.innerHTML = tile.proximity;
    } else {
      this.getAdjacentTiles(tile.symbol.id)
          .forEach(tile => this.openTile(tile));
    }
  }

  onRightClick(e) {
    e.preventDefault();
    console.log('rclick', e);

    const id = parseInt(e.target.id);
    console.log(e.target, id);
    if (!id && id !== 0) return;

    console.log('id');

    this.flagTile(this.tiles[id]);
  }

  flagTile(tile) {
    console.log(tile.open);
    if (tile.open) return;

    console.log(tile.flagged);

    switch (tile.flagged) {
      case FlagType.NONE:
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
    const tileSize = config.tileSize + config.tileBorder * 2 + config.tileGap;
    this.world.style.width = `${config.size.x * tileSize + config.tileGap}px`;
    this.world.style.height = `${config.size.y * tileSize + config.tileGap}px`;
    for (var i = 0, il = config.size.x * config.size.y; i < il; i++) {
      const tile = document.createElement('DIV');
      tile.classList.add('tile', '-closed');
      tile.id = `${i}`;

      tile.style.height = `${config.tileSize}px`;
      tile.style.width = `${config.tileSize}px`;
      tile.style.borderWidth = `${config.tileBorder}px`;

      tile.style.marginTop = `${config.tileGap}px`;
      tile.style.marginLeft = `${config.tileGap}px`;

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

  async setUpMines(clickedTileId) {
    const nonArmedTileIds = this.getAdjacentTiles(clickedTileId)
                                .map(tile => parseInt(tile.symbol.id));
    while (this.mines.length < config.mines) {
      let place = Math.floor(Math.random() * config.size.x * config.size.y);

      if (this.tiles[place].armed || place === clickedTileId) continue;
      if (nonArmedTileIds.includes(place)) {
        console.log('includes', place);
        continue;
      }

      this.tiles[place].armed = true;
      // this.tiles[place].symbol.style.background = 'orange';
      this.mines.push(place);
    }
  }



  updateIndicators() {
    for (var i = 0, il = config.size.x * config.size.y; i < il; i++) {
      const iteratedTile = this.tiles[i];

      this.getAdjacentTiles(i).forEach(tile => {
        if (tile.armed && !iteratedTile.armed) {
          iteratedTile.proximity++;
        }
      });

      iteratedTile.symbol.style.color =
          Constants.IndicatorColors[iteratedTile.proximity - 1];
    }
  }

  endGame(tile) {
    tile.symbol.style.background = 'red';

    this.tiles.forEach(tile => {
      if (tile.armed && tile.flagged !== FlagType.FLAGGED) {
        tile.symbol.innerHTML = '';
        tile.symbol.classList.remove('-closed');
        tile.symbol.appendChild(this.mineGenerator.dispatch());
      }
    });

    this.world.removeEventListener('click', this.clickHandler);
    this.world.removeEventListener('contextmenu', this.rightClickHandler);
    // alert('Game over');
  }

  getAdjacentTiles(id) {
    id = parseInt(id);
    // Top tiles
    const topTiles = [
      id % config.size.x ? this.tiles[id - config.size.x - 1] : undefined,
      this.tiles[id - config.size.x],
      (id + 1) % config.size.x ? this.tiles[id - config.size.x + 1] : undefined,
    ];

    const sideTiles = [
      id % config.size.x ? this.tiles[id - 1] : undefined,
      (id + 1) % config.size.x ? this.tiles[id + 1] : undefined,
    ];

    const bottomTiles = [
      id % config.size.x ? this.tiles[id + config.size.x - 1] : undefined,
      this.tiles[id + config.size.x],
      (id + 1) % config.size.x ? this.tiles[id + config.size.x + 1] : undefined,
    ];

    return [...topTiles, ...sideTiles, ...bottomTiles].filter(a => a);
  }
};

(() => {
  window['GAME'] = new Game();
})();