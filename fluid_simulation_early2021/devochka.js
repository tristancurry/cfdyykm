const RHO_W = 998; //kg per m^3

const ELM_LENGTH = 0.3; //m
const ELM_DIAM = 0.064; //m

const dt = 0.1; //s

let INTERVALS = 1;
if (INTERVALS < 1) {INTERVALS = 1;}
const dt_sub = dt/INTERVALS;
console.log(dt_sub);

const PRESSURE_W = 1e5; //Pa

let canvas0 = document.getElementById('canvas0');
let ctx0 = canvas0.getContext('2d');

// set up 'mesh' for a test pipe that is 10m long.
let pipe_length = 10;
let pipe_nodes = Math.floor(pipe_length/ELM_LENGTH);
pipe_length = pipe_nodes*ELM_LENGTH;

let initialiseGrid = (value) => {
  let array = [];
  for (let j = 0; j < pipe_nodes; j++) {
    if (!value) {array.push(0);} else {array.push(value);}
  }
  return array;
}

//the following quantities will be packaged together for each pipe

let v = {
  values: initialiseGrid(),
  values_new: initialiseGrid(),
  values_old: initialiseGrid(),
  targets: initialiseGrid([]),
}

v.values[3] = 5;

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

mass.values[3] = 3;

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

let advect_fwd = (quantity, velocity, delta_t) => {

  quantity.targets = initialiseGrid([]);
  //loop through all nodes in vector field and advect quantities to new locations.
  for (let i = 0, l = velocity.values.length; i < l; i++) {
    if (velocity.values[i] != 0) {
      let vel = velocity.values[i];
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
          //find how far away the target node is from the effective node and use to apportion the advected quantity
          let frac = 1 - Math.abs(node_res - neighbours[u]);
          //check if target is 'out of bounds' and handle appropriately.
          //This would ordinarily mean checking downstream connected pipes and seeing where in those it ends up
          //If there's a wall instead, simply move the fluid as far as possible and then handling reflection/attenuation later
          if (neighbours[u] >= l) { neighbours[u] = l - 1; }
          else if (neighbours[u] < 0) { neighbours[u] = 0; }
          target_nodes.push({x:neighbours[u], fraction: frac});
      }
      quantity.targets[i] = target_nodes.slice();
    }
  }
}

//this function checks each point for the amount of a quantity requested
//this is only important if it's an unsigned quantity like mass
//go to each node. Add up the the requested proportions.
//if the proportion is > 1, then normalise the outflows.
//mutate the targets list as we go (no need for a deep copy)
let restrictOutflow = (targets) => {
  for (let i = 0, l = targets.length; i < l; i++) {
    let outflows = 0;
    let thisTargets = targets[i];
    for(let j = 0, m = thisTargets.length; j < m; j++) {
      outflows += thisTargets[j].fraction;
    }
    if (outflows > 1) {
      //normalise the outflows
      for(let j = 0, m = thisTargets.length; j < m; j++) {
        thisTargets[j].fraction = thisTargets[j].fraction/outflows;
      }
    }
  }
}

let applyFlows = (quantity) => {
  if (quantity.unsigned) {
    restrictOutflow(quantity.targets);
  }

  //seed quantity.values_new matrix with current values
  //the sub arrays must be cloned, rather than referenced
  for (let i = 0, l = quantity.values.length; i < l; i++) {
    if (quantity.values_old) {
      quantity.values_old = quantity.values.map(elem => elem);
    }
    quantity.values_new = quantity.values.map(elem => elem);
  }

  for (let i = 0, l = quantity.targets.length; i < l; i++) {
    let thisTargets = quantity.targets[i];
    let thisValue = quantity.values[i];
    for (let j = 0, m = thisTargets.length; j < m; j++) {
      let thisTarget = thisTargets[j];

      let flow = thisTarget.fraction*thisValue;
      if(!quantity.unsigned) {
        if((flow > 0 && i == l - 1) || (flow < 0 && i == 0)) {
          quantity.values_new[thisTarget.x] -= flow;
        }
      } else {
        quantity.values_new[thisTarget.x] += flow;
      }
      quantity.values_new[i] -= flow;
    }
  }

  //update quantity vector with new values
  //the array must be cloned, rather than referenced
  quantity.values = quantity.values_new.map(elem => elem);
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
    mass.targets = initialiseGrid([]);
    v.targets = initialiseGrid([]);

    advect_fwd(mass, v, dt_sub);
    advect_fwd(v, v, dt_sub);
    applyFlows(mass);
    applyFlows(v);
  }

  render();
  requestAnimationFrame(animate);
}

animate();
