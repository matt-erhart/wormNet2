const _ = require("lodash");
import { colors } from "./constants";
import { rgb01 } from "./scaleNeuronPositions";
const getSourceAndTargetNeurons = (neurons, sourceId, targetId) => {
  const source = _.find(neurons, neuron => neuron.id === sourceId);
  const target = _.find(neurons, neuron => neuron.id === targetId);
  if (!source || !target) debugger;
  return { source, target };
};

export const linkPositions = (links, neurons) => {
  let linksArray = [];
  let indexes = [];
  links.forEach((link, i) => {
    const { source, target } = getSourceAndTargetNeurons(
      neurons,
      link.source.id,
      link.target.id
    );
    linksArray.push(source.pos3d);
    linksArray.push(target.pos3d);
    indexes[i] = [i * 2 - 2, i * 2 - 1];
  });
  return { linksArray, indexes };
};

export const propagationsAsArrays = (propagations, neurons) => {
  let propagationSources = [];
  let propagationTargets = [];
  let startEndTimes = [];
  let propagationPosColors = [];
  let propagationTypeColors = [];

  propagations.forEach((propagation, i) => {
    const { source, target } = getSourceAndTargetNeurons(
      neurons,
      propagation.source.id,
      propagation.target.id
    );
    propagationSources[i] = source.pos3d;
    propagationTargets[i] = target.pos3d;
    propagationPosColors[i] = source.rgb;
    propagationTypeColors[i] =
      source.type === "excites"
        ? rgb01(colors.excitesInActive)
        : rgb01(colors.inhibitsInActive);

    startEndTimes[i] = [
      propagation.source.activationTime,
      propagation.target.activationTime
    ];
  });
  console.log(propagationTypeColors[0])
  return {
    propagationSources,
    propagationTargets,
    startEndTimes,
    propagationPosColors,
    propagationTypeColors
  };
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
