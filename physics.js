


// Establish mesh
// We will try to adapt a 2D scheme to a 1D case...
// Staggered grid: pressure is stored at cell centre, while velocities are stored at the faces
const rho = 997;
const nu = 1e-6;
const nx = 100;   //number of cells within computational domain
const i_min = 2, i_max = i_min + nx - 1; //extents of computational domain
const L_x = 100; //m , length of computational domain

// CREATE MESH
let x = []; //array to store positions of left face of each element
let x_m = []; //array to store positions of middle of each element

for (let i = i_min; i < i_max + 1; i++) {
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
const dxi2 = Math.pow(dxi,2);
const dt = 0.01;
// console.log('x = ' + x + '\nx_m =  ' +  x_m + '\ndx = ' + dx);

let elm_container = document.getElementsByClassName('elm_container')[0];
for(i = 0; i < i_max + 2; i++){
  let elm_div = document.createElement('div');
    elm_div.className = 'elm';
    elm_container.appendChild(elm_div);
}

let elm_divs = document.getElementsByClassName('elm');
function elm_div_opac (div) {
  let op = Math.round(100*(p[i])/(1e5));
  div.style.backgroundColor = 'hsl( 280, 100%, ' + op + '%)';
}



// define u for each element...

let u = [];
let us = [];

for (let i = i_min; i < i_max + 2; i++) {
  u[i] = 0;
}

u[10] = 0.01;

// define pressure for each getElementsByClassName

let p = [];

for (let i = i_min - 1; i < i_max + 2; i++) {
  p[i] = 0;
}


function visualise () {
// core of the 'u momentum discretisation' scheme. CD on the diffusion (2nd order), FD on the advection term


  for(let i = i_min + 1; i < i_max + 1; i++) {
    us[i]  = u[i] + dt*(nu*(u[i - 1] - 2*u[i] + u[i + 1])*dxi2 - u[i]*(u[i + 1] - u[i - 1])*dxi/2)
  }
  us[i_min] = 0;
  us[i_max + 1] = 0;
  // console.log(u);
  // console.log(us);

  // Define three vectors from Laplacian operator,
  // one is the diagonal
  // the other two are the diagonals adjacent to the diagonal
  // this will hopefully speed up calculation
  //actually, only need the central vector, the others are all 1's anyway!

  let L = [];

  for (let i = 0; i < nx; i++) {
    L[i] = -2*dxi2;
    if(i == 0 || i == nx - 1) {
      L[i] += 1*dxi2;
    }
  }

  //Define R vector
  let R = [];
  for(let i = i_min, n = 0; i < i_max + 1; i++) {
    R[n] = -1*(rho/dt)*(us[i + 1] - us[i])*dxi;
    n++;
  }

  console.log(R);
  // Implement Gauss-Siedel relaxation

  let pv = []; //store pressure values

  for (let i = i_min, n = 0; i < i_max + 1; i++) {
    pv[n] = p[i];
    n++;
  }
  console.log(pv);

  for(let k = 0; k < 20; k++) {
    for (let i = 0; i < L.length; i++) {
      pv[i] = 0;
      pv[i] += R[i];
      if (i > 0) {
        pv[i] -= pv [i - 1];
      }
      if (i < pv.length - 1) {
        pv[i] -= pv[i + 1];
      }
      pv[i] *= (1/L[i]);
    }

  }

  for (let i = i_min, n = 0; i < i_max + 1; i++) {
    p[i] = pv[n];
    n++;
  }

  //console.log(p);
  // corrector step - use pressure values to update velocities

  for (let i = i_min; i < i_max + 2; i++) {
    u[i] = us[i] - (dt/rho)*(p[i] - p[i - 1])*dxi;
  }

  console.log(u);
  console.log(p);
  // boundary conditions


  for(i = i_min; i < i_max + 1; i++){
    elm_div_opac(elm_divs[i]);
    //elm_divs[i].style.height = 100 + '%';
    elm_divs[i].innerHTML =  Math.floor(p[i])/1000 + 'kPa <br>'+ Math.floor(1000*u[i])/1000 + 'm/s';
  }

  //requestAnimationFrame(visualise);

}

let viewport = document.getElementsByClassName('viewport')[0];
viewport.addEventListener('click', visualise);

// visualise();
