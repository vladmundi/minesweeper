export class Options {
  settingsButton: HTMLElement;
  settingsPanel: HTMLElement;

  constructor() {
    this.createButtons();
    this.createPanel();
    this.setUpInteraction();
  }

  createButtons() {
    // create wrapper
    const wrapper = document.createElement("div");
    wrapper.classList.add("options_wrapper");

    this.settingsButton = document.createElement("div");
    this.settingsButton.classList.add("settings_button");

    wrapper.appendChild(this.settingsButton);
    document.body.prepend(wrapper);
  }

  createPanel() {
    // create wrapper
    const wrapper = document.createElement("div");
    wrapper.classList.add("settings_wrapper");

    this.settingsButton = document.createElement("div");
    this.settingsButton.classList.add("settings_button");

    wrapper.appendChild(this.settingsButton);
    document.body.prepend(wrapper);
  }

  setUpInteraction() {
    this.settingsButton.addEventListener(
      "click",
      () => (this.settingsPanel.dataset.open = "true")
    );
  }
}
