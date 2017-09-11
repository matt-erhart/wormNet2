const d3 = require("d3-scale");
const extent = require("d3-array").extent;
const d3rgb = require("d3-color").rgb;

var math = require("mathjs");
var dist = require("gl-vec2").distance;
var vec2 = require("gl-vec2").fromValues;
import { colors } from "./constants";

const topLeft = vec2(-1.0, 1.0);
function rainbowRGB(value) {
  const rgb = d3rgb(d3.interpolateRainbow(value));
  return [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0];
}

export const rgb01 = color => {
  const rgb = d3rgb(color);
  return [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0];
};

//** NDC is normalized display coords. Webgl coords. */
const pixelsToNDC = (x, y, plotWidth, plotHeight) => {
  return [2.0 * (x / plotWidth - 0.5), -(2.0 * (y / plotHeight - 0.5))];
};

export const scaleNeuronPositions = (
  neurons,
  plotWidth = 1000,
  plotHeight = 1000
) => {
  const pad = 20;
  const xs = neurons.map(row => +row.pos[0]);
  const ys = neurons.map(row => +row.pos[1]);
  const xRange = extent(xs);
  const yRange = extent(ys);

  const xScale = d3
    .scaleLinear()
    .domain(xRange)
    .range([0 + pad, plotWidth - pad]);

  const yScale = d3
    .scaleLinear()
    .domain(yRange)
    .range([0 + pad, plotHeight - pad]);

  neurons.forEach((neuron, i) => {
    neurons[i].posScaled = pixelsToNDC(
      xScale(neuron.pos[0]),
      yScale(neuron.pos[1]),
      plotWidth,
      plotHeight
    );

    neurons[i].distFromTopLeft = dist(vec2(...neurons[i].posScaled), topLeft);
  });

  const dists = neurons.map(n => n.distFromTopLeft);
  const distsRange = extent(dists);
  const distScale = d3
    .scaleLinear()
    .domain(distsRange)
    .range([0, 1]);

  neurons.forEach((neuron, i) => {
    neurons[i].distFromTopLeft = distScale(neurons[i].distFromTopLeft);
    neurons[i].pos3d = [
      ...neurons[i].posScaled,
      Math.abs(neurons[i].posScaled[0])
    ];
    neurons[i].rgbPos = rainbowRGB(neurons[i].distFromTopLeft);
    neurons[i].rgbType =
      neuron.type === "excites"
        ? rgb01(colors.excitesInActive)
        : rgb01(colors.inhibitsInActive);
  });
  console.log(neurons[0]);

  return neurons;
};
