import {FancyNumbers} from './constants';
import {NumberDisplayGenerator} from './generators/numberDisplay';


export class FancyNumberDisplay extends NumberDisplayGenerator {
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
      const fancyConfig = FancyNumbers[char];
      console.log(fancyConfig);
      fancyConfig.forEach(dash => {
        this.display.children[2 - i].children[dash - 1].classList.add('lit');
      });
    }
  }
}