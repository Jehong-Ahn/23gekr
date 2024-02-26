global.HTMLElement = class {};
global.Storage = class Storage {
  clear() {
    Object.keys(this).forEach(k => delete this[k]);
  }
};
global.localStorage = new global.Storage();
global.sessionStorage = new global.Storage();