// Mondrian-style generator for acoustic panel arrays.
// The canvas is split into a left and a right group of panels. Each group is
// carved into rectangles on its own grid, so the left side can stay sparse
// (1-2 big panels) while the right side gets busier (4-5 smaller ones).
//
// Based on the original Mondrian generator code provided by Josh Rogers.

let canvas = document.querySelector('canvas');
let context = canvas.getContext('2d');

let width = 800;
let height = 400;
let gap = 8;          // space between panels (the "grout" line)
let groupGap = 22;   // wider space between the left and right groups
let margin = 24;      // room around the groups for their drop shadows
let colorShare = 0.45; // roughly this fraction of panels get a color
let cornerRadius = 3;// rounding on each panel's corners
let edgeWidth = 2;    // thin accent line on each panel's left and bottom
let edgeColor = 'rgba(0, 0, 0, 0.12)';

let palettes = {
  felt: {
    base: '#f3efe7',
    colors: ['#3d4a5c', '#b5653f', '#c9a227', '#7d8c6a']
  },
  classic: {
    base: '#ffffff',
    colors: ['#d40920', '#f7d842', '#1356a2']
  },
  original: {
    base: '#ffffff',
    colors: ['red', 'yellow', 'blue']
  }
};

// Each group: where it sits, how far apart its column (stepX) and row (stepY)
// cuts are, and which slider sets its panel count. Smaller steps = a finer
// grid, so more panels are possible.
let groupWidth = (width - groupGap) / 2;
let groups = [
  // Left: columns and rows of 45% / 45% / 10%.
  { x: 0, y: 0, width: groupWidth, height: height, stepX: groupWidth * 0.45, stepY: height * 0.45, slider: '#left-panels' },
  { x: groupWidth + groupGap, y: 0, width: groupWidth, height: height, stepX: 400 / 3 + 20, stepY: 400 / 3 + 20, slider: '#right-panels' }
];

// The most panels a group can have: every row and column cut made.
function maxPanels(group) {
  let columns = Math.ceil(group.width / group.stepX);
  let rows = Math.ceil(group.height / group.stepY);
  return columns * rows;
}

function splitSquaresWith(squares, coordinates, splitChance) {
  const { x, y } = coordinates;
  for (let i = squares.length - 1; i >= 0; i--) {
    const square = squares[i];
    if (x !== undefined && x > square.x && x < square.x + square.width) {
      if (Math.random() < splitChance) {
        squares.splice(i, 1);
        splitOnX(squares, square, x);
      }
    }

    if (y !== undefined && y > square.y && y < square.y + square.height) {
      if (Math.random() < splitChance) {
        squares.splice(i, 1);
        splitOnY(squares, square, y);
      }
    }
  }
}

function splitOnX(squares, square, splitAt) {
  squares.push({ x: square.x, y: square.y, width: splitAt - square.x, height: square.height });
  squares.push({ x: splitAt, y: square.y, width: square.x + square.width - splitAt, height: square.height });
}

function splitOnY(squares, square, splitAt) {
  squares.push({ x: square.x, y: square.y, width: square.width, height: splitAt - square.y });
  squares.push({ x: square.x, y: splitAt, width: square.width, height: square.y + square.height - splitAt });
}

// Build layouts with a random chance of each cut until one has the panel
// count the slider asks for (or keep the closest one found).
function generateGroup(group) {
  let target = Number(document.querySelector(group.slider).value);
  let best = null;
  for (let attempt = 0; attempt < 500; attempt++) {
    let squares = layoutGroup(group, 0.05 + Math.random() * 0.9);
    if (!best || Math.abs(squares.length - target) < Math.abs(best.length - target)) {
      best = squares;
    }
    if (best.length === target) break;
  }

  // Color about colorShare of the rectangles (at least one), each in a
  // different color where the palette allows. Panels store a color slot
  // rather than a color, so switching palettes keeps the same layout.
  let share = best.length * colorShare;
  let colored = Math.max(1, Math.floor(share) + (Math.random() < share % 1 ? 1 : 0));
  let firstSlot = Math.floor(Math.random() * 12);
  let indexes = best.map((_, i) => i).sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(colored, best.length); i++) {
    best[indexes[i]].colorSlot = firstSlot + i;
  }

  return best;
}

// The current layout of each group, so one side can be regenerated alone.
let layouts = [];

function regenerate(groupIndexes) {
  for (let i of groupIndexes) {
    layouts[i] = generateGroup(groups[i]);
  }
  draw();
}

function layoutGroup(group, splitChance) {
  let squares = [{ x: group.x, y: group.y, width: group.width, height: group.height }];

  // Measure the cuts from the top or bottom, and from the left or right, at
  // random, so the leftover sliver row/column lands at either edge.
  let fromBottom = Math.random() < 0.5;
  let fromRight = Math.random() < 0.5;

  // Rows are cut every stepY and columns every stepX. Cuts that fall outside
  // the group are ignored by splitSquaresWith.
  let lines = Math.max(group.width / group.stepX, group.height / group.stepY);
  for (let n = 1; n < lines; n++) {
    let y = fromBottom ? group.y + group.height - n * group.stepY : group.y + n * group.stepY;
    let x = fromRight ? group.x + group.width - n * group.stepX : group.x + n * group.stepX;
    splitSquaresWith(squares, { y: y }, splitChance);
    splitSquaresWith(squares, { x: x }, splitChance);
  }

  return squares;
}

function draw() {
  let palette = palettes[document.querySelector('#palette').value];
  let dpr = window.devicePixelRatio || 1;
  canvas.width = (width + margin * 2) * dpr;
  canvas.height = (height + margin * 2) * dpr;
  canvas.style.aspectRatio = `${width + margin * 2} / ${height + margin * 2}`;
  context.setTransform(dpr, 0, 0, dpr, margin * dpr, margin * dpr);

  let panels = layouts.flat();

  // Each panel stands on its own, with the page background in the gaps.
  // Draw every shadow first, then every panel on top, so one panel's shadow
  // never falls across its neighbor.
  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.3)';
  context.shadowBlur = 12;
  context.shadowOffsetX = -3;
  context.shadowOffsetY = 4;
  panels.forEach((panel) => fillPanel(panel, palette));
  context.restore();

  panels.forEach((panel) => fillPanel(panel, palette));
  panels.forEach(edgePanel);
}

function fillPanel(panel, palette) {
  context.fillStyle = panel.colorSlot === undefined
    ? palette.base
    : palette.colors[panel.colorSlot % palette.colors.length];
  context.beginPath();
  context.roundRect(
    panel.x + gap / 2,
    panel.y + gap / 2,
    panel.width - gap,
    panel.height - gap,
    cornerRadius
  );
  context.fill();
}

// A thin, faint line along the left and bottom edges of each panel, curving
// around the bottom-left corner.
function edgePanel(panel) {
  let top = panel.y + gap / 2;
  let right = panel.x + panel.width - gap / 2;
  // Inset by half the line width so the line sits just inside the panel.
  let left = panel.x + gap / 2 + edgeWidth / 2;
  let bottom = panel.y + panel.height - gap / 2 - edgeWidth / 2;
  let radius = Math.max(cornerRadius - edgeWidth / 2, 0);

  context.strokeStyle = edgeColor;
  context.lineWidth = edgeWidth;
  context.beginPath();
  context.moveTo(left, top + cornerRadius);
  context.lineTo(left, bottom - radius);
  context.arcTo(left, bottom, left + radius, bottom, radius);
  context.lineTo(right - cornerRadius, bottom);
  context.stroke();
}

document.querySelector('#regenerate-left').addEventListener('click', () => regenerate([0]));
document.querySelector('#regenerate-right').addEventListener('click', () => regenerate([1]));
document.querySelector('#regenerate-both').addEventListener('click', () => regenerate([0, 1]));
document.querySelector('#palette').addEventListener('change', draw);

// Each slider runs from 1 panel up to the most its group's grid allows. Its
// wedge fills in up to the thumb to show the count visually. Moving it
// regenerates only its own side.
groups.forEach((group, index) => {
  let slider = document.querySelector(group.slider);
  let wedge = slider.closest('.wedge');
  let showFill = () => {
    let fraction = (slider.value - slider.min) / (slider.max - slider.min);
    wedge.style.setProperty('--fill', fraction);
  };
  slider.max = maxPanels(group);
  showFill();
  slider.addEventListener('input', () => {
    showFill();
    regenerate([index]);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !['SELECT', 'INPUT', 'BUTTON'].includes(event.target.tagName)) {
    event.preventDefault();
    regenerate([0, 1]);
  }
});

regenerate([0, 1]);
