import {Generator} from './generator';


export class MineGenerator extends Generator {
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