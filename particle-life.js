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


// Debug section don't touch
let debug = 1;
function toggleDebug() {
    if (!debug) {
        debug = 1;
    } else {
        debug = 0;
    }
}

let loop_counter = 0;

// Helper functions
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

let colors = new Array(); // Set up actual colors thing


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
        let f = this._force(this, source_point);
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

function generateParticles(n, type, randomX, randomY, forcefunc) {
    let particles = new Array();
    for (let i = 0; i < n; i++) {
        let x = randomX();
        let y = randomY();
        let particle = new Particle(type, x, y, forcefunc);
        particles.push(particle);
    }
    if (debug) {console.log('Generated ' + n + ' particles of type ' + type)}
    return particles;
}


class Simulation {
    constructor(particles) {
        this.particles = particles;
        // Add them all to the sectors array
        this.particles.forEach((particle, i) => {
            sectors[pos_to_sector(particle.x, particle.y)].push(particle);
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
                true_sector = pos_to_sector(particle.x, particle.y);
                if (i != true_sector) { // If we need the particle to go to a new sector, add it to that sector and add its index to a list to be removed.
                    remove.push(j);
                }
                sectors[true_sector].push(particle);
            });
            sectors[i] = sectors[i].reduce((acc, value, index) => { // Remove all remove-marked particles
                remove.indexOf(index) == -1 ? [...acc, value] : acc}, []
            ); // https://www.geeksforgeeks.org/how-to-remove-multiple-elements-from-array-in-javascript/

        }

    }
}







function drawDot(color, x, y) {
    // TODO Implement
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

function drawParticle(particle) {
    let color = colors[particle.type];
    drawDot(color, particle.x, particle.y);
}

// Animate the current frame
function frame_animate(simu) {
    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw each particle
    for (let i = 0; i < sectors.length; i++) {
        let points = sectors[i];
        points.forEach((i, point) => drawParticle(point));
    }
    simu.tick();
}

// Actual function for running
function main() {
    let matrix = [ // Force matrix
        [0,     1,      -1,     0],
        [1,     0,      0.5,    1],
        [-1,    0.5,    0,      -0.2],
        [0,     1,      -0.2,   0]
    ];

    let forcefunc = (source, target) => { // Function for applying force
        return matrix[source.type][target.type];
    };
    let randomx = () => {
        return Math.random() * canvas.width;
    };
    let randomy = () => {
        return Math.random() * canvas.height;
    };

    let particle_types = [
        {
            type: 0,
            number: 10,
            color: 'red',
            func: forcefunc
        },
        {
            type: 1,
            number: 10,
            color: 'yellow',
            func: forcefunc
        },
        {
            type: 2,
            number: 10,
            color: 'blue',
            func: forcefunc
        },
        {
            type: 3,
            number: 10,
            color: 'green',
            func: forcefunc
        },
    ];

    let particle_arrays = Array();
    for (const ptype of particle_types) {
        colors.push(ptype.color);
        particle_arrays.push(generateParticles(ptype.number, ptype.type, randomx, randomy, ptype.func));
    }
    let particles = particle_arrays.flat();
    if (debug) { console.log('Generated ' + particles.length + ' particles'); }

    // Set up simulation first
    let simulation = new Simulation(particles);

    // Call animate to start loop
    animate = () => {
        requestAnimationFrame(animate);
        frame_animate(simulation);
        loop_counter += 1;
        if (debug) { console.log('Loop ' + loop_counter); }
    }
    animate();
}

main();
