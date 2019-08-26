export class Generator {
  item;
  constructor() {
    this.item = this.createItem();
  }

  createItem() {}

  dispatch() {
    return this.item.cloneNode(true);
  }
};