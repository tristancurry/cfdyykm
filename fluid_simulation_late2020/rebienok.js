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

//the velocity field and its x_comps, y_comps, determine advection for every quantity, including velocity
//the advection proportions only need to be determined ONCE then applied to each relevant quantity
//from there, the different diffusive properties of each quantity will determine how those things evolve

let advect_fwd = (quantity, x_comps, y_comps) => {
  quantity_targets = [];
  //loop through all nodes in vector field and advect quantities to new locations.
  for (let i = 0, l = x_comps.length; i < l; i++) {
    for (let j = 0, m = x_comps[i].length; j < m; j++) {
      let dist_x = x_comps[i][j]*dt;
      let dist_y = y_comps[i][j]*dt;
      //next - determine the nodes this (off-grid) location falls between
      //i.e. resultant i =  i + dist_x (floor and ceiling), similarly for resultant j
      let i_res = i + dist_x;
      let i_res_neighbours = [Math.floor(i_res), Math.ceil(i_res)];

      let j_res = j + dist_y;
      let j_res_neighbours = [Math.floor(j_res), Math.ceil(j_res)];

      let proportions = [[0.25,0.25][0.25,0.25]];
      let proportions_mag = 0;

      //then reverse-interpolate in i and j to work out how much of the quantity is received by each node
      //requires Pythagorean distance to each node from the resultant point.
      for (let u = 0, u < i_res_neighbours.length; u++) {
        for (let v = 0, v < j_res_neigbours.length; v++) {
          proportions[u][v] = Math.sqrt(Math.pow(i_res - i_res_neighbours[u], 2) + Math.pow(j_res - j_res_neighbours[v], 2));
          proportions_mag += proportions[u][v];
        }
      }

      //normalise proportions matrix
      for (let u = 0, u < i_res_neighbours.length; u++) {
        for (let v = 0, v < j_res_neigbours.length; v++) {
          proportions[u][v] = proportions[u][v]/proportions_mag;
        }
      }

      //store the fractions requested by each point for later application
      for (let u = 0, u < i_res_neighbours.length; u++) {
        for (let v = 0, v < j_res_neigbours.length; v++) {
          quantity_targets[i][j].push({x:i_res_neighbours[u], y:j_res_neigbours[v], fraction:quantity[i][j]*proportions[u][v]});


        }
      }

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

      let i_res = i + dist_x;
      let i_res_neighbours = [Math.floor(i_res), Math.ceil(i_res)];

      let j_res = j + dist_y;
      let j_res_neighbours = [Math.floor(j_res), Math.ceil(j_res)];

      let proportions = [[0.25,0.25][0.25,0.25]];
      let proportions_mag = 0;

      let inter_quantity = (quantity[i_res_neighbours[0]][j_res_neighbours[0]]*(i_res_neighbours[1] - i_res) +
      quantity[i_res_neighbours[1]][j_res_neighbours[0]]*(i_res - i_res_neighbours[0]))*(j_res_neigbours[1] - j_res) +
      (quantity[i_res_neighbours[0]][j_res_neighbours[1]]*(i_res_neighbours[1] - i_res) +
    quantity[i_res_neighbours[1]][j_res_neighbours[1]]*(i_res - i_res_neighbours[0]))*(j_res - j_res_neigbours[0]);

      for (let u = 0, u < i_res_neighbours.length; u++) {
        for (let v = 0, v < j_res_neigbours.length; v++) {
          proportions[u][v] = Math.sqrt(Math.pow(i_res - i_res_neighbours[u], 2) + Math.pow(j_res - j_res_neighbours[v], 2));
          proportions_mag += proportions[u][v];
        }
      }

      //normalise proportions matrix
      for (let u = 0, u < i_res_neighbours.length; u++) {
        for (let v = 0, v < j_res_neigbours.length; v++) {
          proportions[u][v] = proportions[u][v]/proportions_mag;
        }
      }


      //store the fractions requested from each point for later application
      for (let u = 0, u < i_res_neighbours.length; u++) {
        for (let v = 0, v < j_res_neigbours.length; v++) {
          quantity_targets[i_res_neighbours[u]][j_res_neigbours[v]].push({x:i, y:i, fraction:inter_quantity*proportions[u][v]});
        }
      }
  }
}


// in here there must be a checking step to avoid negative values of strictly positive quantities from happening
// e.g. fraction of mass drawn from a point must never exceed 1.
// store for each point a list of requesting points - calculate total fractional demand. If it exceeds 1, normalise demands before honouring them!
