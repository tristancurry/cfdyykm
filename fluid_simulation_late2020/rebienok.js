//need to define a grid of some sort
//or a number of corresponding grids, all layered
//effectively, each node has several properties, represented across the grids

//start with a 2D grid and work it back to 1D

//need dx & dy - distance between points (metres)
let dx = 1;
let dy = 1;

//need dt - timestep for rendering
//need dt_sub - timestep for calculation

let dt = 0.1;
let INTERVALS = 100;
let dt_sub = dt/INTERVALS;


let nx = 64; //number of nodes in x-direction in each grid.
let ny = 64; //number of nodes in y-direction in each grid.

let canvas0 = document.getElementById('canvas0');
let ctx0 = canvas0.getContext('2d');


let initialiseGrid = (value) => {
  let matrix = [];
  for (let i = 0; i < nx; i++) {
    let column = [];
    for (let j = 0; j < ny; j++) {
      if (!value) {column.push(0);} else {column.push(value);}
    }
    matrix.push(column);
  }
  return matrix;
}

let v_x = {
  values: initialiseGrid(),
  values_new: initialiseGrid(),
  values_old: initialiseGrid(),
  targets: initialiseGrid([]),
}

let v_y = {
  values: initialiseGrid(),
  values_new: initialiseGrid(),
  values_old: initialiseGrid(),
  targets: initialiseGrid([]),

}

v_x.values[5][5] = 2;
v_y.values[5][5] = 2;


let mass = {
  values: initialiseGrid(50),
  values_new: initialiseGrid(),
  values_old: initialiseGrid(),
  targets: initialiseGrid([]),
  unsigned: true,
}

mass.values[Math.floor(nx/2)][Math.floor(ny/2)] = 300;



console.log(mass);
console.log(v_x);
console.log(v_y)

//in the following functions, 'quantity' is any value that can be defined on nodes in the grid (e.g. anything carried in the fluid)
//this could be velocity, density, colour concentration, dye, temp, etc etc

//the velocity field and its x_comps, y_comps, determine advection for every quantity, including velocity
//the advection proportions only need to be determined ONCE then applied to each relevant quantity
//from there, the different diffusive properties of each quantity will determine how those things evolve

let advect_fwd = (quantity, x_comps, y_comps) => {

  quantity.targets = initialiseGrid([]);
  //loop through all nodes in vector field and advect quantities to new locations.
  for (let i = 0, l = x_comps.length; i < l; i++) {
    for (let j = 0, m = x_comps[i].length; j < m; j++) {
      if(x_comps[i][j] != 0 || y_comps[i][j] != 0) {
        let dist_x = x_comps[i][j]*dt/dx;
        let dist_y = y_comps[i][j]*dt/dy;
        //next - determine the nodes this (off-grid) location falls between
        //i.e. resultant i =  i + dist_x (floor and ceiling), similarly for resultant j
        let i_res = i + dist_x;
        let i_res_neighbours = [Math.floor(i_res), Math.ceil(i_res)];
        if (i_res_neighbours[0] == i_res_neighbours[1]) {
          i_res_neighbours = [i_res];
        }

        let j_res = j + dist_y;
        let j_res_neighbours = [Math.floor(j_res), Math.ceil(j_res)];
        if (j_res_neighbours[0] == j_res_neighbours[1]) {
          j_res_neighbours = [j_res];
        }


        let target_nodes = [];
        for (let u = 0; u < i_res_neighbours.length; u++) {
          for (let v = 0; v < j_res_neighbours.length; v++) {
            target_nodes.push({x:i_res_neighbours[u], y:j_res_neighbours[v]});
          }
        }

        //then 'reverse-interpolate' in i and j to work out how much of the quantity is received by each node
        let dist_sum = 0;
        if(target_nodes.length > 1) {
          for (let k = 0; k < target_nodes.length; k++) {
            //calculate distances of each node from the resultant point
            let target = target_nodes[k];
            target.dist = 1;// Math.sqrt(Math.pow(target.x - i_res, 2) + Math.pow(target.y - j_res, 2));
            dist_sum += 1/target.dist;

          }

          for (let k = 0; k < target_nodes.length; k++) {
            let target = target_nodes[k];
            target.fraction = (1 - Math.abs(i_res - target.x)/dx)*(1 - Math.abs(j_res - target.y)/dy);
          }
        } else {
          target_nodes[0].fraction = 1;
        }

        //check for out-of-bounds targets and wrap.
        for (let k = 0; k < target_nodes.length; k++) {
          let target = target_nodes[k];

          if (target.x > nx - 1) {
            target.x = (target.x)%nx;
          } else if (target.x < 0) {
            while (target.x < 0) {
              target.x  = nx + target.x;
            }
          }

          if (target.y > ny - 1) {
            target.y = (target.y)%ny;
          } else if (target.y < 0) {
            while (target.y < 0) {
              target.y = ny + target.y;
            }
          }
        }

        //store the fractions requested by each point for later application
        quantity.targets[i][j] = target_nodes.slice();
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
      if(i_res > nx - 1) {
        i_res = i_res%nx;
      } else if (i_res < 0) {
        while (i_res < 0) {
          i_res += nx;
        }
      }
      let i_res_neighbours = [Math.floor(i_res), Math.ceil(i_res)];
      // console.log('i_res_neighbours: ' + i_res_neighbours );



      let j_res = j + dist_y;
      if(j_res > ny - 1) {
        j_res = j_res%ny;
      } else if (j_res < 0) {
        while (j_res < 0) {
          j_res += ny;
        }
      }
      let j_res_neighbours = [Math.floor(j_res), Math.ceil(j_res)];




      if (i_res_neighbours[0] == i_res_neighbours[1]) {
        i_res_neighbours = [i_res_neighbours[0]];
      }

      if (j_res_neighbours[0] == j_res_neighbours[1]) {
        j_res_neighbours = [j_res_neighbours[0]];
      }

      let source_nodes = [];

      //TODO - work out how the inter_quantity is to be proportionately taken from the surrounding nodes.

      for (let u = 0; u < i_res_neighbours.length; u++) {
        for (let v = 0; v < j_res_neighbours.length; v++) {
          source_nodes.push({x: i_res_neighbours[u], y: j_res_neighbours[v], fraction: (1 - Math.abs(i_res - i_res_neighbours[u])/dx)*(1 - Math.abs(j_res - j_res_neighbours[v])/dy)});
        }
      }

      let inter_quantity = 0;

      for (let k = 0, n = source_nodes.length; k < n; k++) {
        let source = source_nodes[k];
        if (source.x > nx - 1) {
          source.x = (source.x)%nx;


        } else if (source.x < 0) {
          while (source.x < 0) {
            source.x  = (nx + source.x);
          }
        }

        if (source.y > ny - 1) {
          source.y = (source.y)%ny;
        } else if (source.y < 0) {
          while (source.y < 0) {
            source.y  = (ny + source.y);
          }
        }
        inter_quantity += quantity.values[source.x][source.y]*source.fraction;
        if(quantity.targets[source.x][source.y] === 0) {
          quantity.targets[source.x][source.y] = [];
        }
        quantity.targets[source.x][source.y].push({x:i, y:j, fraction: source.fraction});
      }
    }
  }
}

//this function checks each point for the amount of a quantity requested
//this is only important if it's an unsigned quantity like mass
//go to each node. Add up the the requested proportions.
//if the proportion is > 1, then normalise the outflows.
//mutate the targets matrix as we go (no need for a deep copy)
let restrictOutflow = (targets) => {
  for (let i = 0, l = targets.length; i < l; i++) {
    for (let j = 0, m = targets[i].length; j < m; j++) {
      let outflows = 0;
      let thisTargets = targets[i][j];
      for (let k = 0, n = thisTargets.length; k < n; k++) {
        outflows += thisTargets[k].fraction;
      }
      if (outflows > 1) {
        //normalise the outflows
        for (let k = 0, n = thisTargets.length; k < n; k++) {
          thisTargets[k].fraction = thisTargets[k].fraction/outflows;
        }
      }
    }
  }
}

//this function goes through each node for the quantity and distributes the flows according to
//the 'quantity-targets'
let applyFlows = (quantity) => {
  if (quantity.unsigned) {
    restrictOutflow(quantity.targets);
  }

  //seed quantity.values_new matrix with current values
  //the sub arrays must be cloned, rather than referenced
  for (let i = 0, l = quantity.values.length; i < l; i++) {
    if (quantity.values_old) {
      quantity.values_old[i] = quantity.values[i].map(elem => elem);
    }
    quantity.values_new[i] = quantity.values[i].map(elem => elem);
  }

  for (let i = 0, l = quantity.targets.length; i < l; i++) {
    for (let j = 0, m = quantity.targets[i].length; j < m; j++) {
      let thisTargets = quantity.targets[i][j];
      let thisValue = quantity.values[i][j];
      for (let k = 0, n = thisTargets.length; k < n; k++) {
        let thisTarget = thisTargets[k];
        let flow = thisTarget.fraction*thisValue;
        quantity.values_new[thisTarget.x][thisTarget.y] += flow;
        quantity.values_new[i][j] -= flow;
      }
    }
  }

  //update quantity matrix with new values
  //the sub arrays must be cloned, rather than referenced
  for (let i = 0, l = quantity.values.length; i < l; i++) {
    quantity.values[i] = quantity.values_new[i].map(elem => elem);
  }
}

let applyPressure = (quantity, quantity_factor, x_comps, y_comps) => {
  let ax = initialiseGrid();
  let ay = initialiseGrid();

  for (let i = 0, l = quantity.values.length; i < l; i++) {
    for (let j = 0, m = quantity.values[i].length; j < m; j++) {
      let next_x = (i + 1)%nx;
      let next_y = (j + 1)%ny;
      let prev_x = (i - 1);
      if (prev_x < 0) {prev_x += nx;}
      let prev_y = (j - 1);
      if (prev_y < 0) {prev_y += ny;}

      let force_x = quantity_factor*(quantity.values[i][j] - quantity.values[next_x][j]);
      let force_y = quantity_factor*(quantity.values[i][j] - quantity.values[i][next_y]);

      if(quantity.values[i][j] > 0) {
      ax[i][j] += force_x;
      ax[next_x][j] += force_x;
      ay[i][j] += force_y;
      ay[i][next_y] += force_y;
      }
    }
  }
  for (let i = 0, l = quantity.values.length; i < l; i++) {
    for (let j = 0, m = quantity.values[i].length; j < m; j++) {
      x_comps[i][j] += ax[i][j];
      y_comps[i][j] += ay[i][j];
    }
  }
}

let diffuse = (quantity, diffusion_factor) => {
  for (let i = 0, l = quantity.values.length; i < l; i++) {
    for (let j = 0, m = quantity.values[i].length; j < m; j++) {
      let n_left = i - 1;
      let n_right = (i + 1)%nx;
      let n_up = j - 1;
      let n_down = (j + 1)%ny;

      if (n_left < 0) {
        n_left += nx;
      }

      if (n_up < 0) {
        n_up += ny;
      }

      let thisTargets = quantity.targets[i][j].slice();
      if(quantity.values[n_left][j] !== quantity.values[i][j]) {thisTargets.push({x: n_left, y: j, fraction: diffusion_factor/4});}
      if(quantity.values[n_right][j] !== quantity.values[i][j]) {thisTargets.push({x: n_right, y: j, fraction: diffusion_factor/4});}
      if(quantity.values[i][n_up] !== quantity.values[i][j]) {thisTargets.push({x: i, y: n_up, fraction: diffusion_factor/4});}
      if(quantity.values[i][n_down] !== quantity.values[i][j]) {thisTargets.push({x: i, y: n_down, fraction: diffusion_factor/4})};
      quantity.targets[i][j] = thisTargets.slice();
    }
  }
}

let applyFriction = (x_comps, y_comps, friction_factor) => {
  for (let i = 0, l = x_comps.length; i < l; i++) {
    for (let j = 0, m = x_comps[i].length; j < m; j++) {
      x_comps[i][j] *= (1 - friction_factor);
      y_comps[i][j] *= (1 - friction_factor);
    }
  }
}

//TODO: create map of 'neighbour nodes' for each node - yet another nx by ny array, can be reconstructed depending on wrapping, node contents etc
let crom = false;
let render = () => {
  ctx0.fillStyle = 'rgb(0,0,0)';
  ctx0.fillRect(0, 0, canvas0.width, canvas0.height);

  for (let u = 0; u < mass.values.length; u++) {
    for (let v = 0; v < mass.values[u].length; v++) {
      ctx0.fillStyle = `rgb(${2.5*mass.values[u][v]}, ${2.5*mass.values[u][v]}, ${2.5*mass.values[u][v]})`;
      ctx0.fillRect(u*(canvas0.width/mass.values.length), v*(canvas0.height/mass.values[u].length), canvas0.width/mass.values.length, canvas0.height/mass.values[0].length);
    }
  }
  mass.targets = initialiseGrid([]);
  advect_fwd(mass, v_x.values, v_y.values);
  advect_fwd(v_x, v_x.values, v_y.values);
  advect_fwd(v_y, v_x.values, v_y.values);
if(crom){
  advect_rev(mass, v_x.values, v_y.values);
  advect_rev(v_x, v_x.values, v_y.values);
  advect_rev(v_y, v_x.values, v_y.values);
}
  // diffuse(mass, 0.001);
  // diffuse(v_x, 0.001);
  // diffuse(v_y, 0.001);

  applyFlows(mass);

  applyFlows(v_x);
  applyFlows(v_y);
  // applyFriction(v_x.values, v_y.values, 0.005);
  applyPressure(mass, 0.01, v_x.values, v_y.values);
  crom = true;
  requestAnimationFrame(render);
}

render();
