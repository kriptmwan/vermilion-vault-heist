// input.js — keyboard and mouse, kept apart from the game logic.
// The world reads `held` directions and `pressed` one-shot actions;
// the mouse reports a tile in world pixels for the coin throw.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressedKeys = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, rightClicked: false };
    this.onFirstGesture = null;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }
      if (!e.repeat) {
        this.pressedKeys.add(e.key.toLowerCase());
        this.gesture();
      }
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', (e) => {
      this.gesture();
      if (e.button === 0) this.mouse.clicked = true;
      if (e.button === 2) this.mouse.rightClicked = true;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('blur', () => this.keys.clear());
  }

  gesture() {
    if (this.onFirstGesture) this.onFirstGesture();
  }

  // Held movement: WASD or arrows, as a unit vector (or zero).
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  get sneaking() {
    return this.keys.has('shift');
  }

  // One-shot: true once per physical press, then cleared by the world.
  wasPressed(key) {
    return this.pressedKeys.has(key.toLowerCase());
  }

  endFrame() {
    this.pressedKeys.clear();
    this.mouse.clicked = false;
    this.mouse.rightClicked = false;
  }
}
