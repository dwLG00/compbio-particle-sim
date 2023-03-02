// Get the canvas element and its context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set the dimensions of the canvas to match the size of the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Simulation settings
const dt = 1/60;

// Sector constants (for calculating particle forces)
const divx = 10;
const divy = 10;
const n_sectors = divx * divy;

const sec_width = canvas.width / divx;
const sec_height = canvas.height / divy;

const repel_distance = 2;
const repel_strength = 1;

const epsilon = 0.000001; // Needed for some sector shenanigans

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
let draw_counter = 0;
let terminate_flag = 100;





// Helper functions
function pos_to_sector(x, y) {
    // Takes (x, y) coordinates to sector id (left-to-right, top-to-bottom).
    let sec_x = Math.floor(x / sec_width);
    let sec_y = Math.floor(y / sec_height);
    return sec_y * divx + sec_x;
}

function* adjacent_sectors(sector) {
    // Yields a list of sectors that are adjacent to given sector (max 8 sectors)
    yield sector; // Self
    if (sector % divx > 0) {
        yield sector - 1;
        if ((sector - 1) / divx >= 1) { yield (sector - 1) - divx; }
        if ((sector - 1) / divx < (divy - 1)) { yield (sector - 1) + divx; }
    }
    if (sector % divx < (divx - 1)) {
        yield sector + 1;
        if ((sector + 1) / divx >= 1) { yield (sector + 1) - divx; }
        if ((sector + 1) / divx < (divy - 1)) { yield (sector + 1) + divx; }
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
    apply_force(target_point) {
        // Calculate force applied to other by self

        // Constants
        let dx = this.x - target_point.x;
        let dy = this.y - target_point.y;
        let dR = dx*dx + dy*dy;
        let dr = Math.sqrt(dR);
        let a = Math.atan(dy, dx);
        let xangle = Math.cos(a);
        let yangle = Math.sin(a);

        let f = 0;

        if (0 < dr < repel_distance) {
            f = repel_strength * (repel_distance - dr) / (dr + 1);
        }
        if (dr > repel_distance) {
            f = this._force(this, target_point) * (dr - repel_distance);
        }
        let fx = f * xangle;
        let fy = f * yangle;

        // This math probably comes from solving an integral. I'm bad at physics so it could be bogus
        this.vx += fx * dt;
        this.vy += fy * dt;
    }

    tick() {
        // Updates position from velocity and bound
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.x >= canvas.width) {
            this.x = canvas.width - epsilon;
        }
        if (this.x <= 0) {
            this.x = epsilon;
        }
        if (this.y >= canvas.height) {
            this.y = canvas.height - epsilon;
        }
        if (this.y <= 0) {
            this.y = epsilon;
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
        for (const particle of this.particles) {
            let sector = pos_to_sector(particle.x, particle.y);
            sectors[sector].push(particle);
            if (debug) { console.log('Pushed (' + particle.x + ', ' + particle.y + ') to ' + sector) }
        }
        if (debug) {
            for (let i = 0; i < sectors.length; i++) {
                console.log('Sector ' + i + ': ' + sectors[i].length + ' particles');
            }
        }
    }
    tick() {
        // Apply forces
        for (let i = 0; i < sectors.length; i++) { // For each sector
            let csector = sectors[i];
            let neighbors = [...adjacent_sectors(i)]; // Get all neighbors
            for (const neighbor_sector of neighbors) { // For each neighbor
                let sector = sectors[neighbor_sector];
                if (sector.length == 0) { return; } // Skip if empty
                for (const source of csector) { // For particle in source sector
                    for (const target of sector) { // For particle in neighbor sector
                        source.apply_force(target); // Apply force
                    }
                }
            }
        }

        // Actually apply the force thing
        for (let i = 0; i < sectors.length; i++) {
            let remove = Array();
            for (let j = 0; j < sectors[i].length; j++) {
                let particle = sectors[i][j];
                particle.tick();
                let true_sector = pos_to_sector(particle.x, particle.y);
                if (i != true_sector) { // If we need the particle to go to a new sector, add it to that sector and add its index to a list to be removed.
                    remove.push(j);
                    if (debug) { console.log('New particle pos: (' + particle.x + ', ' + particle.y + ')'); }
                    if (debug) { console.log('Moving particle to ' + true_sector); }
                    sectors[true_sector].push(particle);
                }
            }
            sectors[i] = sectors[i].reduce((acc, value, index) => { // Remove all remove-marked particles
                if (remove.indexOf(index) == -1) {
                    return [...acc, value];
                } else {
                    return acc;
                }
            }, []); // https://www.geeksforgeeks.org/how-to-remove-multiple-elements-from-array-in-javascript/
        }

    }
}







function drawDot(color, x, y) {
    // TODO Implement
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 5, 5);
    draw_counter++;
}

function drawParticle(particle) {
    let color = colors[particle.type];
    drawDot(color, particle.x, particle.y);
}

function drawSector(sector) {
    let sec_x = sector % divx;
    let sec_y = Math.floor(sector / divx);
    let x = sec_x * sec_width;
    let y = sec_y * sec_height;
    ctx.fillRect(x, y, sec_width, sec_height);
}


// Animate the current frame
function frame_animate(simu) {
    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw each particle
    for (let i = 0; i < sectors.length; i++) {
        let points = sectors[i];
        for (const point of points) {
            drawParticle(point);
        }
    }
    simu.tick();
}

function animate_frames(frames) {
    // Animate pre-generated frames
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < frames.length; i++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let frame = frames[i];
        for (const particle of frame) {
            drawParticle(particle);
        }
        console.log('Drew frame ' + i);
    }
}

let frames = new Array();

// Actual function for running
function main() {
    let matrix = [ // Force matrix
        [0,     1,      -1,     0],
        [0,     0,      1,     -1],
        [-1,     0,      0,     1],
        [1,     -1,      0,     0]
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
            number: 50,
            color: 'red',
            func: forcefunc
        },
        {
            type: 1,
            number: 50,
            color: 'yellow',
            func: forcefunc
        },
        {
            type: 2,
            number: 50,
            color: 'blue',
            func: forcefunc
        },
        {
            type: 3,
            number: 50,
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
    if (debug) { console.log('Colors: ' + colors); }

    // Set up simulation first
    let simulation = new Simulation(particles);

    // Call animate to start loop
    animate = () => {
        if (loop_counter != terminate_flag) {
            loop_counter += 1;
            requestAnimationFrame(animate);
            frame_animate(simulation);
            if (debug) {
                console.log('Loop ' + loop_counter);
                console.log('Draws: ' + draw_counter);

                let sum = 0;
                for (let i = 0; i < sectors.length; i++) {
                    for (let j = 0; j < sectors[i].length; j++) {
                        sum += (sectors[i][j].x * sectors[i][j].y);
                    }
                }
                console.log('Frame hash: ' + sum);
            }
            draw_counter = 0;
        }
    }
    animate();

    /*
    let n_frames = 60 * 100;
    for (let i = 0; i < n_frames; i++) {
        let cframe = new Array();
        for (let j = 0; j < sectors.length; j++) {
            for (let k = 0; k < sectors[j].length; k++) {
                let x = sectors[j][k].x;
                let y = sectors[j][k].y;
                let type = sectors[j][k].type;
                cframe.push({x: x, y: y, type: type});
            }
        }
        frames.push(cframe);
    }
    */
    return simulation;
}

let simu = main();
//animate_frames(frames);
