const glsl = require("glslify");
const linspace = require("ndarray-linspace");
const vectorFill = require("ndarray-vector-fill");
const ndarray = require("ndarray");
const ease = require("eases/cubic-in-out");
import { scaleNeuronPositions } from "./scaleNeuronPositions";
const data = require("./assets/data/full.json");
// const data = {}
import { propagationsAsArrays, linkPositions } from "./organizeData";
const scaleLinear = require("d3-scale").scaleLinear;
const mat4 = require("gl-mat4");
const range = require("d3-array").range;
import _ from "lodash";
var hasCanvas = document.querySelector("canvas");
if (hasCanvas) hasCanvas.remove();
let canvas = document.createElement("canvas");
import {colors} from './constants'
import {rgb01} from './scaleNeuronPositions'

const padCanvas = 20;
if (window.innerHeight > window.innerWidth) {
  canvas.height = window.innerWidth - padCanvas;
  canvas.width = window.innerWidth - padCanvas;
} else {
  canvas.height = window.innerHeight - padCanvas;
  canvas.width = window.innerHeight - padCanvas;
}


Object.assign(document.body.style,{display: "flex", justifyContent: "center", background: "black"});
const el = document.body.appendChild(canvas);

let neurons = scaleNeuronPositions(data.neurons, canvas.width, canvas.height);
const links = linkPositions(data.links, neurons);
const propagations = propagationsAsArrays(data.propagations, neurons);
const nTimePoints = _.max(_.flattenDeep(propagations.startEndTimes).map(x=>+x))
let elapsedTime = 0;
let prog = 0;
let startTime = 0;
let duration = 60; //seconds
const timeScale = scaleLinear()
  .domain([0, nTimePoints])
  .range([0, 1]);
const elapsedScale = scaleLinear()
  .domain([0, nTimePoints])
  .range([0, duration]);

const timeRange = range(nTimePoints).map(x => timeScale(x) * duration);
const spikeRadius = 30;
const radius = 10;
let spikes = neurons.map((neuron, i) => {
  const spks = _.flattenDeep(
    neuron.spikeTimes.map(x => range(8).map(y => y + x))
  ); //spike duration
  return timeRange.map((t, ti) => {
    return spks.indexOf(ti) > 0 ? spikeRadius : radius;
  });
});

let startEndTimesFromAnimationDuration = propagations.startEndTimes.map(
  times => {
    return times.map(x => timeScale(+x) * duration);
  }
);

console.log(_.max(_.flattenDeep(propagations.startEndTimes).map(x=>+x)), propagations)


const regl = require("regl")({
  extensions: ["EXT_disjoint_timer_query", "OES_standard_derivatives"],
  canvas: el,
  onDone: require("fail-nicely")
});

let camera = require("canvas-orbit-camera")(canvas,{eye:[0,0,3.4]});

/**
 * THE NEURONS
 */
spikes = _.zip.apply(_, spikes); //transpose
let spikeBuffer = regl.buffer(spikes[0]);
let xy = regl.buffer(neurons.map(n => n.pos3d));
const type = neurons.map(n => n.type);
const active = {excites: colors.excitesActive, inhibits: colors.inhibitsActive }
const inactive = {excites: colors.excitesInActive, inhibits: colors.inhibitsInActive }

let colorByTime = spikes.map((arr,i) => {
  return arr.map((rad, i) => {
    return rad === spikeRadius?
    rgb01(active[type[i]]):
    rgb01(inactive[type[i]])
  })
})

let colorBuff = regl.buffer(colorByTime[0]);


const drawPoints = regl({
  vert: require("raw-loader!glslify-loader!./pointStatic.vert"),
  frag: require("raw-loader!glslify-loader!./pointInterp.frag"),
  blend: {
    enable: true,
    func: {
      srcRGB: "one",
      srcAlpha: "one",
      dstRGB: "one minus src alpha",
      dstAlpha: "one minus src alpha"
    }
  },
  depth: { enable: false },
  attributes: {
    xy: () => xy,
    colors: () => colorBuff,
    radius: spikeBuffer
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

/**
 * PROPAGATION
 */
let propagationSources = regl.buffer(propagations.propagationSources);
let propagationTargets = regl.buffer(propagations.propagationTargets);
let propagationColors = regl.buffer(propagations.propagationTypeColors);
let startEndTimes = regl.buffer(startEndTimesFromAnimationDuration);
let color01 = regl.buffer(propagations.startEndTimes.map(n => 0.5));

const interpPoints = regl({
  blend: {
    enable: true,
    func: {
      srcRGB: "one",
      srcAlpha: "one",
      dstRGB: "one minus src alpha",
      dstAlpha: "one minus src alpha"
    }
  },
  vert: require("raw-loader!glslify-loader!./pointInterp.vert"),
  frag: require("raw-loader!glslify-loader!./pointInterp.frag"),
  cull: {
    enable: true,
    face: "back"
  },
  depth: { enable: false },
  attributes: {
    propagationSources: propagationSources,
    propagationTargets: propagationTargets,
    propagationColors: propagationColors,
    startEndTimes: startEndTimes,
    color01: color01
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

/**
 * LINE
 */
let line = regl({
  depth: { enable: false },
  frag: `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }`,

  vert: `
    precision mediump float;
    attribute vec3 position;
    uniform mat4 projection, view, model;
    uniform float aspect;

    void main() {
      gl_Position = projection * view * model * vec4(position.x, position.y * aspect, position.z, 1);
    }`,

  attributes: {
    position: links.linksArray
  },

  uniforms: {
    color: [47/255, 47/255, 47/255, 1],
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

  count: links.linksArray.length,
  lineWidth: 1,
  primitive: "line"
});

let f = regl.frame(({ tick, time }) => {
    regl.clear({
      color: [0, 0, 0, 1],
      depth: 1
    });
  camera.tick();
  if (startTime === 0) {
    startTime = time;
  }
  const t = Math.round(elapsedScale.invert(elapsedTime));
  line();
  if (t < nTimePoints) {
    spikeBuffer({ data: spikes[t] });
    colorBuff({data: colorByTime[t]})
  }
  
  drawPoints();
  elapsedTime = elapsedTime >= duration ? elapsedTime : time - startTime;
  interpPoints([
    { radius: 7, elapsedTime }, 
    { radius: 5, elapsedTime: elapsedTime - .01 },
    { radius: 3, elapsedTime: elapsedTime - .02 },
  ]);
  
});
