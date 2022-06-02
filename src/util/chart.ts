const COLORS = [
  [ 31, 119, 180 ],
  [ 255, 127, 14 ],
  [ 44, 160, 44 ],
  [ 214, 39, 40 ],
  [ 148, 103, 189 ],
  [ 140, 86, 75 ],
  [ 227, 119, 194 ],
  [ 127, 127, 127 ],
  [ 188, 189, 34 ],
  [ 23, 190, 207 ]
];

export function getBackgroundColor(index: number) {
  const color = COLORS[index % COLORS.length];

  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.4)`;
}

export function getBorderColor(index: number) {
  const color = COLORS[index % COLORS.length];

  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}