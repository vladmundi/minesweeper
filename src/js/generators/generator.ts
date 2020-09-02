export class Generator {
  item: any;
  constructor() {
    this.item = this.createItem();
  }

  createItem() {}

  dispatch(): HTMLElement {
    return this.item.cloneNode(true);
  }
}
