export function getBackgroundColor(value: string) {
  return `hsla(${getHash(value) % 360}, 95%, 35%, 0.4)`;
}

export function getBorderColor(value: string) {
  return `hsl(${getHash(value) % 360}, 95%, 35%)`;
}

function getHash(value: string) {
  return [...value].reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
}