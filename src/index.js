const glsl = require("glslify");
const linspace = require("ndarray-linspace");
const vectorFill = require("ndarray-vector-fill");
const ndarray = require("ndarray");
const ease = require("eases/cubic-in-out");

var hasCanvas = document.querySelector("canvas");
if (hasCanvas) hasCanvas.remove();
let canvas = document.createElement("canvas");
canvas.height = window.innerHeight - 20;
canvas.width = window.innerWidth - 20;
const el = document.body.appendChild(canvas);

const regl = require("regl")({
  canvas: el,
  onDone: require("fail-nicely")
});

const nPoints = 2;
const pointRadius = 50;

const drawPoints = regl({
  vert: `
    precision mediump float;
    attribute vec2 xy0, xy1; //points to interpolate between
    attribute float color01; //color map value between 0 and 1
    varying float color01_v2f; // vertex 2 frag
    uniform float aspect, interp01, radius; //interp 0-1
    void main () {
        color01_v2f = color01; //varying passes to frag
        vec2 pos = mix(xy0, xy1, interp01);
        gl_Position = vec4(pos.x, pos.y * aspect, 0, 1);
        gl_PointSize = radius;
    }`,
  frag: glsl(`
    precision mediump float;
    #pragma glslify: colormap = require(glsl-colormap/viridis)
    varying float color01_v2f; //from the vertex shader
    void main () {
        gl_FragColor = colormap(color01_v2f);
    }
    `),
  depth: { enable: false },
  attributes: {
    xy0: () => regl.buffer([[0, 0], [0,0]]),
    xy1: () => regl.buffer([[.4, 0], [0,.4]]),
    color01: () => regl.buffer([0.5, .3])
  },
  uniforms: {
    radius: regl.prop('radius'),
    aspect: ctx => ctx.viewportWidth / ctx.viewportHeight,
    interp01: (ctx, props) => Math.max(0, Math.min(1, props.interp01))
  },
  primitive: "point",
  count: () => nPoints
});

regl.frame(({ tick, time }) => {
//   regl.clear({
//     color: [0, 0, 0, 1],
//     depth: 1
//   });
  drawPoints({ interp01: Math.sin(time), radius: Math.sin(time)*100 });
});
