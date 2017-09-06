const d3 = require("d3");

//** NDC is normalized display coords. Webgl coords. */
const pixelsToNDC = (x, y, plotWidth, plotHeight) => {
  return [2.0 * (x / plotWidth - 0.5), -(2.0 * (y / plotHeight - 0.5))];
};

module.exports = scaleNeuronPositions = (neurons, plotWidth = 1000, plotHeight = 1000) => {
  const pad = 20;
  const xs = neurons.map(row => +row.pos[0]); 
  const ys = neurons.map(row => +row.pos[1]);
  const xRange = d3.extent(xs); 
  const yRange = d3.extent(ys);
  const xScale = d3
    .scaleLinear()
    .domain(xRange)
    .range([0 + pad, plotWidth - pad]); 
  const yScale = d3
    .scaleLinear()
    .domain(yRange)
    .range([0 + pad, plotHeight - pad]);

  neurons.forEach((neuron, i) => {
    neurons[i].posScaled = 
      pixelsToNDC(xScale(neuron.pos[0]), yScale(neuron.pos[1]), plotWidth, plotHeight);
  });
  return neurons;
};