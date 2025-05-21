'use babel';

export default class NasmCompilerView {
  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('nasm-compiler');

    // Create status message element
    const message = document.createElement('div');
    message.textContent = 'NASM Compiler package ready';
    message.classList.add('message');
    this.element.appendChild(message);
  }

  serialize() {}

  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }
}
