import {Generator} from './generator';


export class NumberDisplayGenerator extends Generator {
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