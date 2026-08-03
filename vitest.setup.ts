import '@testing-library/jest-dom'

// jsdom does not implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = () => {}

// jsdom does not always expose crypto.randomUUID
if (!crypto.randomUUID) {
  Object.defineProperty(crypto, 'randomUUID', {
    value: () => Math.random().toString(36).slice(2),
  })
}
