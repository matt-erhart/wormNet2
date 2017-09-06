const _ = require("lodash");
const d3 = require("d3");

getSourceAndTargetNeurons = (neurons, sourceId, targetId) => {
  const source = _.find(neurons, neuron => neuron.id === sourceId);
  const target = _.find(neurons, neuron => neuron.id === targetId);
  if (!source || !target) debugger;
  return { source, target };
};

linkPositions = (links, neurons) => {
  const scaledLinks = links.map(link => {
    const { source, target } = getSourceAndTargetNeurons(
      neurons,
      link.source.id,
      link.target.id
    );
    const sx = source.posScaled[0];
    const sy = source.posScaled[1];
    const tx = target.posScaled[0];
    const ty = target.posScaled[1];
    return { sx, sy, tx, ty, id: link.id };
  });
};

module.exports = propagationsAsArrays = (propagations, neurons) => {
  let propagationSources = [];
  let propagationTargets = [];
  let startEndTimes = [];

  propagations.forEach((propagation, i) => {
    const { source, target } = getSourceAndTargetNeurons(
      neurons,
      propagation.source.id,
      propagation.target.id
    );
    propagationSources[i] = source.posScaled;
    propagationTargets[i] = target.posScaled;
    startEndTimes[i] = [propagation.source.activationTime, propagation.target.activationTime];
  });
  return {propagationSources, propagationTargets, startEndTimes}
};

// activationLocations = (propagations, time) => {
//   if (!propagations || !time) return;

//   let propagationsOnScreen = this.state.propagations.filter(p => {
//     return (
//       _.get(p, "target.activationTime") >= time &&
//       _.get(p, "source.activationTime") < time
//     );
//   });
//   propagationsOnScreen.forEach((p, i) => {
//     const progress =
//       (time - p.source.activationTime) /
//       (p.target.activationTime - p.source.activationTime);
//     const { source, target } = this.getSourceAndTargetNeurons(
//       this.state.neurons,
//       p.source.id,
//       p.target.id
//     );

//     const pos = d3.interpolateObject(source.posScaled, target.posScaled)(
//       progress
//     );
//     propagationsOnScreen[i].pos = { current: pos, source: source.posScaled };
//     propagationsOnScreen[i].type = source.type;
//     propagationsOnScreen[i].id = source.id + "-" + target.id;
//   });

//   this.setState({ propagationsOnScreen });
// };
