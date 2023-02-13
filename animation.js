// Get the canvas element and its context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set the dimensions of the canvas to match the size of the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize variables for the position and speed of the square
let x = 0;
let y = 0;
let speed = 5;

// Function to draw the square on the canvas
function drawSquare() {
  // Clear the entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set the fill color of the square
  ctx.fillStyle = 'bg-red-500';

  // Draw the square at the current position
  ctx.fillRect(x, y, 50, 50);

  // Move the square to a new position based on its speed
  x += speed;
  y += speed;

  // If the square reaches the edge of the canvas, reverse its direction
  if (x > canvas.width - 50 || x < 0) {
    speed = -speed;
  }
  if (y > canvas.height - 50 || y < 0) {
    speed = -speed;
  }
}

// Function to animate the square by calling the drawSquare function repeatedly
function animate() {
  requestAnimationFrame(animate);
  drawSquare();
}

// Call the animate function to start the animation loop
animate();
