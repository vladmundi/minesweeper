import {FancyNumbers} from './constants';
import {NumberDisplayGenerator} from './generators/numberDisplay';


export class FancyNumberDisplay extends NumberDisplayGenerator {
  display: HTMLElement;

  constructor(display: HTMLElement) {
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

  show(num: number) {
    const digits = num.toString().split('').reverse().map(a => +a);

    for (let i = 0; i < digits.length; i++) {
      const fancyConfig =
          isNaN(digits[i]) ? FancyNumbers[10] : FancyNumbers[digits[i]];
      fancyConfig.forEach((dash) => {
        this.display.children[2 - i].children[dash - 1].classList.add('lit');
      });
    }
  }
}