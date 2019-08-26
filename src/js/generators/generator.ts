export class Generator {
  item: any;
  constructor() {
    this.item = this.createItem();
  }

  createItem() {}

  dispatch() {
    return this.item.cloneNode(true);
  }
};