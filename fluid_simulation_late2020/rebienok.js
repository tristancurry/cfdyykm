//need to define a grid of some sort
//or a number of corresponding grids, all layered
//effectively, each node has several properties, represented across the grids

//start with a 2D grid and work it back to 1D

//need dx & dy - distance between points (metres)
let dx = 0.1;
let dy = 0.1;

//need dt - timestep for rendering
//need dt_sub - timestep for calculation

let dt = 1;
let INTERVALS = 100;
let dt_sub = dt/INTERVALS;


let nx = 100; //number of nodes in x-direction in each grid.
let ny = 100; //number of nodes in y-direction in each grid.

let initialiseGrid = () => {
  let matrix = [];
  for (let i = 0; i < nx; i++) {
    let column = [];
    for (let j = 0; j < ny; j++) {
      column.push(0);
    }
    matrix.push(column);
  }
  return matrix;
}

let v_x = initialiseGrid();
let v_y = initialiseGrid();

v_y[50][50] = 1;

//in the following functions, 'quantity' is any value that can be defined on nodes in the grid (e.g. anything carried in the fluid)
//this could be velocity, density, colour concentration, dye, temp, etc etc

let advect_fwd = (quantity, x_comps, y_comps) => {
  //loop through all nodes in vector field and advect quantities to new locations.
  for (let i = 0, l = x_comps.length; i < l; i++) {
    for (let j = 0, m = x_comps[i].length; j < m; j++) {
      let dist_x = x_comps[i][j]*dt;
      let dist_y = y_comps[i][j]*dt;
      //next - determine the nodes this (off-grid) location falls between
      //i.e. resultant i =  i + dist_x (floor and ceiling), similarly for resultant j
      //then reverse-interpolate in i and j to work out how much of the quantity is received by each node
      //subtract original quantity from origin node.

  }
}

let advect_rev = (quantity, x_comps, y_comps) => {
  //loop through all nodes in vector field, find source value that contributes and advect quantities to new locations.
  for (let i = 0, l = x_comps.length; i < l; i++) {
    for (let j = 0, m = x_comps[i].length; j < m; j++) {
      let dist_x = -1*x_comps[i][j]*dt;
      let dist_y = -1*y_comps[i][j]*dt;
      //next - determine the nodes this (off-grid location) falls between
      //i.e. resultant i =  i + dist_x (floor and ceiling), similarly for resultant j
      //then interpolate in i and j to work out the value of the quantity that 'should' exist at this (off-grid) location
      //add this quantity to the destination node, remove quantity proportionately from each contributing source node.
  }
}


// in here there must be a checking step to avoid negative values of strictly positive quantities from happening
// e.g. fraction of mass drawn from a point must never exceed 1.
// store for each point a list of requesting points - calculate total fractional demand. If it exceeds 1, normalise demands before honouring them!
