const KONAMI = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];

export function createKonamiDetector() {
  let pos = 0;
  return function feed(direction) {
    if (direction === KONAMI[pos]) {
      pos++;
      if (pos === KONAMI.length) {
        pos = 0;
        return true;
      }
    } else {
      pos = direction === KONAMI[0] ? 1 : 0;
    }
    return false;
  };
}
