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
