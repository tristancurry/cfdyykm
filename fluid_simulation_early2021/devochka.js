const RHO_W = 998; //kg per m^3

const ELM_LENGTH = 0.3; //m
const ELM_DIAM = 0.064; //m

const dt = 0.1; //s

const INTERVALS = 100;
const dt_sub = dt/INTERVALS;

const PRESSURE_W = 10e5; //Pa

let canvas0 = document.getElementById('canvas0');
let ctx0 = canvas0.getContext('2d');

// set up 'mesh' for a test pipe that is 10m long.
let pipe_length = 10;
let pipe_nodes = Math.floor(pipe_length/ELM_LENGTH);
pipe_length = pipe_nodes*ELM_LENGTH;

let initialiseGrid = (value) => {
  if(!Array.isArray(value)) {
    let array = new Float64Array(pipe_nodes);
    for (let j = 0; j < pipe_nodes; j++) {
      if (!value) {array[j] = 0;} else {array[j] = value;}
    }
    return array;
  } else {
    let array = [];
    for (let j = 0; j < pipe_nodes; j++) {
      if (!value) {array.push(0);} else {array.push(value);}
    }
    return array;
  }
}

//the following quantities will be packaged together for each pipe

let v = {
  values: initialiseGrid(),
  values_new: initialiseGrid(),
  values_old: initialiseGrid(),
  targets: initialiseGrid([]),
}

v.values[3] = 10;

let rho = {
  values: initialiseGrid(RHO_W),
  values_new: initialiseGrid(),
  values_old: initialiseGrid(),
  targets: initialiseGrid([]),
  unsigned: true,
}

//replace with function to calculate mass as needed from dynamic quantities
let default_mass = Math.PI*Math.pow(0.5*ELM_DIAM,2)*ELM_LENGTH*RHO_W;

let mass = {
  values: initialiseGrid(default_mass),
  values_new: initialiseGrid(),
  values_old: initialiseGrid(),
  targets: initialiseGrid([]),
  unsigned: true,
}

let pressure = {
  values: initialiseGrid(default_mass),
  values_new: initialiseGrid(),
  values_old: initialiseGrid(),
  targets: initialiseGrid([]),
  unsigned: true,
}

let temp = {
  values: initialiseGrid(default_mass),
  values_new: initialiseGrid(),
  values_old: initialiseGrid(),
  targets: initialiseGrid([]),
  unsigned: true,
}

//

let advect_fwd = (quantity, vel, delta_t) => {

  quantity.targets = initialiseGrid([]);
  //loop through all nodes in vector field and advect quantities to new locations.
  for (let i = 0, l = vel.length; i < l; i++) {
    if (vel[i] != 0) {
      let vel = vel[i];
      let dist = vel*delta_t;

      let nodes = dist/ELM_LENGTH; //how many nodes have been traversed?
      let node_res = i + nodes; //what effective node number should this end up at?

      //now have to handle what happens if the effective node is outside this pipe
      //if it turns out to be beyond this pipe, access the next pipe, and work out an effective node number there
      //if it's beyond that pipe, do it again - recurse until a sensible node can be found, or a sink or wall is located

      //for now we act as though both ends of the pipe are sealed
      let neighbours = [Math.floor(node_res), Math.ceil(node_res)];
      //if the advection takes us exactly to a node, reduce to one 'neighbour'
      if (neighbours[0] == neighbours[1]) {
        neighbours = [neighbours[0]];
      }

      let target_nodes = [];
      for (let u = 0; u < neighbours.length; u++) {
          target_nodes.push({x:neighbours[u]});
      }

      //now apportion the advected quantity according to neighbours' relative distance from the effective node
      for (let j = 0; j < target.nodes)


    }
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

        //check for out-of-bounds targets and wrap or reflect as necessary.
        for (let k = 0; k < target_nodes.length; k++) {
          let target = target_nodes[k];

          if (target.x > nx - 1) {
            target.x = (target.x)%nx;
            if (wrap_x == false) {
              target.x = nx - 1 - target.x;
            }
          } else if (target.x < 0) {
            if(wrap_x == true) {
              while (target.x < 0) {
                target.x  = nx + target.x;
              }
            } else {
              while(target.x < -1*nx) {
                target.x += nx;
              }
              target.x = -1*target.x;
            }
          }

          if (target.y > ny - 1) {
            target.y = (target.y)%ny;
            if (wrap_y == false) {
              target.y = ny - 1 - target.y;
            }
          } else if (target.y < 0) {
            if (wrap_y == true) {
              while (target.y < 0) {
                target.y = ny + target.y;
              }
            } else {
              while(target.y < -1*ny) {
                target.y += ny;
              }
              target.y = -1*target.y;
            }
          }
        }

        //store the fractions requested by each point for later application
        quantity.targets[i][j] = target_nodes.slice();
      }
    }
  }
}


//
let render = () => {
  ctx0.fillStyle = 'rgb(0,0,0)';
  ctx0.fillRect(0, 0, canvas0.width, canvas0.height);

  for (let u = 0; u < mass.values.length; u++) {
      ctx0.fillStyle = `rgb(${128*mass.values[u]}, ${128*mass.values[u]}, ${128*mass.values[u]})`;
      ctx0.fillRect(u*(canvas0.width/mass.values.length), 0, canvas0.width/mass.values.length, canvas0.height);
  }
}

let animate = () => {
  for (let i = 0; i < INTERVALS; i++) {

  }

  render();
  requestAnimationFrame(animate);
}

animate();
