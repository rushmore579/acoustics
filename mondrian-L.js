let canvas = document.querySelector('canvas');
let context = canvas.getContext('2d');

let size = 400;
let dpr = window.devicePixelRatio;
canvas.width =  size * dpr;
canvas.height = size * dpr;
context.scale(.5 * dpr, dpr);
context.lineWidth = 8;
let step = (size / 3);
let white = '#ffffff';
let lineGrey = '#cccccc';
let colors = ['red', 'yellow', 'blue']

  let squares = [{
    x: 0,
    y: 0,
    width: size,
    height: size
  }];

  function splitSquaresWith(coordinates) {    
  const { x, y } = coordinates;
  for (let i = squares.length - 1; i >= 0; i--) {
    const square = squares[i];
    if (x && x > square.x && x < square.x + square.width) {
      if(Math.random() > .8) {
        squares.splice(i, 1);
        splitOnX(square, x); 
      }
    }

    console.log(Math.random)

    if (y && y > square.y && y < square.y + square.height) {
      if(Math.random() > 0.5) {
        squares.splice(i, 1);
        splitOnY(square, y); 
      }
    }
  }
}


function splitOnX(square, splitAt) {
  let squareA = {
    x: square.x,
    y: square.y,
    width: square.width - (square.width - splitAt + square.x),
    height: square.height
  };

  let squareB = {
  x: splitAt,
  y: square.y,
  width: square.width - splitAt + square.x,
  height: square.height
  };

  squares.push(squareA);
  squares.push(squareB);
}


function splitOnY(square, splitAt) {
  let squareA = {
    x: square.x,
    y: square.y,
    width: square.width,
    height: square.height - (square.height - splitAt + square.y)
  };

  let squareB = {
  x: square.x,
  y: splitAt,
  width: square.width,
  height: square.height - splitAt + square.y
  };

  squares.push(squareA);
  squares.push(squareB);
}

for (let i = 0; i < size; i += step) {
  splitSquaresWith({ y: i });
  splitSquaresWith({ x: i });
}

function draw() {
  for (let i = 0; i < colors.length; i++) {
    squares[Math.floor(Math.random() * squares.length)].color = colors[i];
  }

  for (let i = 0; i < squares.length; i++) {
    context.beginPath();
    context.rect(
      squares[i].x,
      squares[i].y,
      squares[i].width,
      squares[i].height
      );

    if(squares[i].color) {
      context.fillStyle = squares[i].color;
      context.strokeStyle = lineGrey;
    } 
    else {
      context.fillStyle = white
      context.strokeStyle = lineGrey
    }
    
    context.fill()
    context.stroke()
     
  }
}

draw()

