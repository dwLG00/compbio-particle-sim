// Get the canvas element and its context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set the dimensions of the canvas to match the size of the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Simulation settings
const dt = 1;

// Sector constants (for calculating particle forces)
const divx = 5;
const divy = 5;
const n_sectors = divx * divy;

const sec_width = canvas.width / divx;
const sec_height = canvas.height / divy;

const repel_distance = 1

function pos_to_sector(x, y) {
    // Takes (x, y) coordinates to sector id (left-to-right, top-to-bottom).
    let sec_x = Math.floor(x / sec_width);
    let sec_y = Math.floor(y / sec_height);
    return sec_y * divx + sec_x;
}

function* adjacent_sectors(sector) {
    // Yields a list of sectors that are adjacent to given sector (max 8 sectors)
    if (sector % divx > 0) {
        yield sector - 1;
        if ((sector - 1) / divx >= 1) { yield (sector - 1) - divx; }
        if ((sector - 1) / divx < (divy - 1)) { yield (sector - 1) + divx; }
    }
    if (sector % divx < (divx - 1)) {
        yield sector + 1;
        if ((sector + 1) / divx >= 1) { yield (sector - 1) - divx; }
        if ((sector + 1) / divx < (divy - 1)) { yield (sector - 1) + divx; }
    }
    if (sector / divx >= 1) { yield sector - divx; }
    if (sector / divx < (divy - 1)) { yield sector + divx; }
}

// Set up sectors
let sectors = new Array(n_sectors);
for (var i = 0; i < n_sectors; i += 1) {
    sectors[i] = Array();
}

// Particle data structure
class Particle {
    constructor(type, x, y, forcefunc) {
        // Constructor

        // Type
        this.type = type;

        // Position
        this.x = x;
        this.y = y;

        // Velocity and force
        this.vx = 0;
        this.vy = 0;
        this.fx = 0;
        this.fy = 0;

        // force calculation function
        this._force = forcefunc;
    }

    // Getters
    get pos() {
        return [this.x, this.y];
    }
    get vel() {
        return [this.vx, this.vy];
    }
    get force() {
        return [this.fx, this.fy];
    }
    get sector() {
        return pos_to_sector(this.x, this.y);
    }

    // Calculating force
    apply_force(source_point) {
        // Calculate force applied to self by other point
        let [fx, fy] = this._force(this, source_point);
        // This math probably comes from solving an integral. I'm bad at physics so it could be bogus
        this.vx += fx * dt;
        this.vy += fy * dt;
    }

    tick() {
        // Updates position from velocity and bound
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.x > canvas.width) {
            this.x -= canvas.width;
        }
        if (this.x < canvas.width) {
            this.x += canvas.width;
        }
        if (this.y > canvas.height) {
            this.y -= canvas.height;
        }
        if (this.y < canvas.height) {
            this.y += canvas.height;
        }
    }

    // Helper functions
    static d2(p1, p2) {
        // Distance squared
        return p1.dx * p2.dx + p1.dy * p2.dy;
    }
    static dist(p1, p2) {
        // Cartesian distance
        let dR = this.constructor.d2(p1, p2);
        return Math.sqrt(dR); // This might be a bit slow
    }
}

class Simulation {
    constructor(particles) {
        let this.particles = particles;
        // Add them all to the sectors array
        this.particles.forEach((particle, i) => {
            let [x, y] = particle.pos;
            sectors[pos_to_sector(x, y)].push(particle);
        });
    }
    tick() {
        // Apply forces
        for (let i = 0; i < sectors.length; i++) { // For each sector
            let csector = sectors[i];
            let neighbors = [...adjacent_sectors(i)]; // Get all neighbors
            neighbors.forEach((i, neighbor_sector) => { // For each neighbor
                if (sectors[neighbor_sector].length == 0) { return; } // Skip if empty
                for (const source of csector) { // For particle in source sector
                    for (const target of sectors[neighbor_sector]) { // For particle in neighbor sector
                        source.apply_force(target); // Apply force
                    }
                }
            });
        }

        // Actually apply the force thing
        for (let i = 0; i < sectors.length; i++) {
            let remove = Array();
            sectors[i].forEach((j, particle) => {
                particle.tick();
                let [x, y] = particle.pos;
                true_sector = pos_to_sector(x, y);
                if (i != true_sector) { // If we need the particle to go to a new sector, add it to that sector and add its index to a list to be removed.
                    remove.push(j);
                }
                sectors[true_sector].push(particle);
            });
            sectors[i] = sectors[i].reduce((acc, value, index) => { // Remove all remove-marked particles
                remove.indexOf(index) == -1 ? [...acc, value] : acc}, []
            ); // https://www.geeksforgeeks.org/how-to-remove-multiple-elements-from-array-in-javascript/

        }

        // TODO somehow change which sectors which particles are in

    }
}



/*
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
*/
