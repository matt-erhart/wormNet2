const glsl = require("glslify");
const linspace = require("ndarray-linspace");
const vectorFill = require("ndarray-vector-fill");
const ndarray = require("ndarray");
const ease = require("eases/cubic-in-out");
const scaleNeuronPositions = require("./scaleNeuronPositions");
const data = require("./assets/data/full");
const propagationsAsArrays = require('./organizeData')
const d3 = require('d3');

var hasCanvas = document.querySelector("canvas");
if (hasCanvas) hasCanvas.remove();
let canvas = document.createElement("canvas");

canvas.height = window.innerHeight - 20;
canvas.width = window.innerWidth - 20;

const el = document.body.appendChild(canvas);

const neurons = scaleNeuronPositions(data.neurons, canvas.width, canvas.height);
const propagations = propagationsAsArrays(data.propagations, neurons)
nTimePoints = data.meta[0].numberOfTimePoints;
let prog = 0;
let startTime = 0;
let duration = 30; //seconds
const timeScale = d3
.scaleLinear()
.domain([0,nTimePoints])
.range([0, 1]); 


let startEndTimesFromAnimationDuration = propagations.startEndTimes.map(times => {
  return times.map(x => timeScale(+x) * duration)
})

const regl = require("regl")({
  extensions: ['EXT_disjoint_timer_query'],
  canvas: el,
  onDone: require("fail-nicely")
});

const pointsFrag = glsl(`
precision mediump float;
#pragma glslify: colormap = require(glsl-colormap/viridis)
varying float color01_v2f; //from the vertex shader
void main () {
    gl_FragColor = colormap(color01_v2f);
}
`);

const drawPoints = regl({
  vert: `
  precision mediump float;
  attribute vec2 xy;
  attribute float color01; //color map value between 0 and 1
  varying float color01_v2f; // vertex 2 frag
  uniform float aspect, radius;
  void main () {
      color01_v2f = color01; //varying passes to frag
      gl_Position = vec4(xy.x, xy.y * aspect, 0, 1);
      gl_PointSize = radius;
  }`,
  frag: pointsFrag,
  depth: { enable: false },
  attributes: {
    xy: () => regl.buffer(neurons.map(n => n.posScaled)),
    color01: () =>
      regl.buffer(neurons.map(n => (n.type === "excites" ? 0.1 : 0.9)))
  },
  uniforms: {
    radius: regl.prop("radius"),
    aspect: ctx => ctx.viewportWidth / ctx.viewportHeight,
    interp01: (ctx, props) => Math.max(0, Math.min(1, props.interp01))
  },
  primitive: "point",
  count: () => neurons.length
});

const interpPoints = regl({
  profile: true,  
  vert: `
    precision mediump float;
    attribute vec2 propagationSources, propagationTargets, startEndTimes; //points to interpolate between
    attribute float color01; //color map value between 0 and 1
    varying float color01_v2f; // vertex 2 frag
    uniform float aspect, elapsedTime, radius; //interp 0-1
    float progress01;
    void main () {
        if (startEndTimes[0] <= elapsedTime && startEndTimes[1] >= elapsedTime) {
          progress01 = (elapsedTime - startEndTimes[0]) / (startEndTimes[1] - startEndTimes[0]);
          vec2 pos = mix(propagationSources, propagationTargets, progress01);
          gl_Position = vec4(pos.x, pos.y * aspect, 0, 1);          
          gl_PointSize = radius;
        } else {
          gl_Position = vec4(-1000, -1000, -1000, 1);
          gl_PointSize = 0.0;
        }
        color01_v2f = color01; //varying passes to frag
    }`,
    cull: {
      enable: true,
      face: 'back'
    },
  frag: pointsFrag,
  depth: { enable: true },
  attributes: {
    propagationSources: () => regl.buffer(propagations.propagationSources),
    propagationTargets: () => regl.buffer(propagations.propagationTargets),
    startEndTimes: () => regl.buffer(startEndTimesFromAnimationDuration),
    color01: () => regl.buffer(propagations.startEndTimes.map(n => 0.5))
  },
  uniforms: {
    radius: regl.prop("radius"),
    aspect: ctx => ctx.viewportWidth / ctx.viewportHeight,
    elapsedTime: regl.prop("elapsedTime")
  },
  primitive: "point",
  count: () => propagations.startEndTimes.length
});

regl.frame(({ tick, time }) => {
  //   regl.clear({
  //     color: [0, 0, 0, 1],
  //     depth: 1
  //   });
  if (startTime === 0) {
    startTime = time;
  } 
  // console.log(startTime, time, (time-startTime))
  // drawPoints({ radius: 10 });
  if (tick < 100) {
    interpPoints({radius: 10, elapsedTime: (time-startTime)})
    if (tick > 100) console.log(interpPoints.stats.gpuTime, interpPoints.stats.cpuTime, time)
  }
  
  
});
