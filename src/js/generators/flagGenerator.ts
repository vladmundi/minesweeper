import { Generator } from "./generator";

export class FlagGenerator extends Generator {
  createItem() {
    const flag = document.createElement("div");
    flag.classList.add("flag");
    return flag;
  }
}
