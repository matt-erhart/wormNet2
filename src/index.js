const glsl = require("glslify");
const linspace = require("ndarray-linspace");
const vectorFill = require("ndarray-vector-fill");
const ndarray = require("ndarray");
const ease = require("eases/cubic-in-out");
import { scaleNeuronPositions } from "./scaleNeuronPositions";
const data = require("./assets/data/full.json");
import { propagationsAsArrays } from "./organizeData";
const d3 = require("d3");
const mat4 = require("gl-mat4");

var hasCanvas = document.querySelector("canvas");
if (hasCanvas) hasCanvas.remove();
let canvas = document.createElement("canvas");

canvas.height = window.innerHeight - 20;
canvas.width = window.innerWidth - 20;

const el = document.body.appendChild(canvas);

const neurons = scaleNeuronPositions(data.neurons, canvas.width, canvas.height);

const propagations = propagationsAsArrays(data.propagations, neurons);

const nTimePoints = data.meta[0].numberOfTimePoints;
let elapsedTime = 0;
let prog = 0;
let startTime = 0;
let duration = 5; //seconds
const timeScale = d3
  .scaleLinear()
  .domain([0, nTimePoints])
  .range([0, 1]);

let startEndTimesFromAnimationDuration = propagations.startEndTimes.map(
  times => {
    return times.map(x => timeScale(+x) * duration);
  }
);

const regl = require("regl")({
  extensions: ["EXT_disjoint_timer_query"],
  canvas: el,
  onDone: require("fail-nicely")
});

let xy = regl.buffer(neurons.map(n => n.pos3d))
let colors = regl.buffer(neurons.map(n => n.rgb))
let camera = require("canvas-orbit-camera")(canvas);

const drawPoints = regl({
  vert: require("raw-loader!glslify-loader!./pointStatic.vert"),
  frag: require("raw-loader!glslify-loader!./pointInterp.frag"),
  depth: { enable: false },
  attributes: {
    xy: () => xy,
    colors: () => colors
  },
  uniforms: {
    radius: regl.prop("radius"),
    aspect: ctx => ctx.viewportWidth / ctx.viewportHeight,
    projection: ({ viewportWidth, viewportHeight }) =>
      mat4.perspective(
        [],
        Math.PI / 4.0,
        viewportWidth / viewportHeight,
        0.1,
        1000
      ),
    model: mat4.identity([]),
    view: () => camera.view()
  },
  primitive: "point",
  count: () => neurons.length
});

let propagationSources = regl.buffer(propagations.propagationSources);
let propagationTargets = regl.buffer(propagations.propagationTargets);
let propagationColors = regl.buffer(propagations.propagationColors);
let startEndTimes = regl.buffer(startEndTimesFromAnimationDuration);
let color01 = regl.buffer(propagations.startEndTimes.map(n => 0.5));

const interpPoints = regl({
  profile: true,
  vert: require("raw-loader!glslify-loader!./pointInterp.vert"),
  frag: require("raw-loader!glslify-loader!./pointInterp.frag"),
  cull: {
    enable: true,
    face: "back"
  },
  depth: { enable: true },
  attributes: {
    propagationSources: () => propagationSources,
    propagationTargets: () => propagationTargets,
    propagationColors: () => propagationColors,
    startEndTimes: () => startEndTimes,
    color01: () => color01
  },
  uniforms: {
    radius: regl.prop("radius"),
    aspect: ctx => ctx.viewportWidth / ctx.viewportHeight,
    elapsedTime: regl.prop("elapsedTime"),
    projection: ({ viewportWidth, viewportHeight }) =>
      mat4.perspective(
        [],
        Math.PI / 4.0,
        viewportWidth / viewportHeight,
        0.1,
        100
      ),
    model: mat4.identity([]),
    view: () => camera.view()
  },
  primitive: "point",
  count: () => propagations.startEndTimes.length
});

let f = regl.frame(({ tick, time }) => {
  //   regl.clear({
  //     color: [0, 0, 0, 1],
  //     depth: 1
  //   });
  camera.tick();
  if (startTime === 0) {
    startTime = time;
  }
  // console.log(startTime, time, (time-startTime))
  // drawPoints({ radius: 10 });
    elapsedTime = elapsedTime >= duration? elapsedTime: time - startTime;
    drawPoints({ radius: 10 });
    interpPoints({ radius: 10, elapsedTime });
    
});
