export class PauseMenu {
  constructor(root, onResume) {
    this.root = root;
    root.querySelector('[data-action="resume"]')?.addEventListener('click', onResume);
  }

  toggle(paused) {
    this.root.classList.toggle('hidden', !paused);
  }
}

export default PauseMenu;