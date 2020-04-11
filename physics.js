// Establish mesh
// We will try to adapt a 2D scheme to a 1D case...
// Staggered grid: pressure is stored at cell centre, while velocities are stored at the faces

const nx = 20;   //number of cells within computational domain
const i_min = 2, i_max = i_min + nx - 1; //extents of computational domain
const L_x = 100; //m , length of computational domain

// CREATE MESH
let x = []; //array to store positions of left face of each element
let x_m = []; //array to store positions of middle of each element

for (let i = i_min; i < i_max + 2; i++) {
    let thisX = L_x*(i - i_min)/(i_max + 1 - i_min);
    x[i] = thisX;
}

 for (let i = i_min; i < i_max + 1; i++) {
     let thisXm = 0.5*(x[i + 1] + x[i]);
     x_m[i] = thisXm;
 }

// CREATE MESH SIZE
const dx = x[i_min + 1] - x[i_min]; // working with constant mesh size - TODO: adapt to variable size
const dxi = 1/dx; // precomputing expensive values

console.log('x = ' + x + '\nx_m =  ' +  x_m + '\ndx = ' + dx);

// define u for each element...

let u = [];
let us = [];

for (let i = i_min; i < i_max + 1; i++) {
  u[i] = 0;
}


// core of the 'u momentum discretisation' scheme. CD on the diffusion (2nd order), FD on the advection term
//us[i]  = u[i] + dt*(nu*(u[i -1] - 2*u[i] + u[i + 1])/Math.pow(dx,2) - u[i]*(u[i + 1] - u[i - 1])/(2*dx))
