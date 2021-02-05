import groupBy from 'lodash/groupBy';

const DEBUG = false;

const drawOnCanvas = (context, options, currentDatapointValues, nextDatapointValues) => {
  let currentStackBase = currentDatapointValues.stackBase;
  let nextStackBase = nextDatapointValues.stackBase;
  let currentStackTopYPos = currentDatapointValues.stackTopYPos;
  let nextStackTopYPos = nextDatapointValues.stackTopYPos;

  /* If the heights match top to bottom or bottom to top then
  flip the top coordinates to be at the bottom so that a horizontal step line is drawn */
  if (currentStackTopYPos === nextStackBase) {
    nextStackTopYPos = nextStackBase;
    nextStackBase = nextDatapointValues.dummyStackBase;
  } else if (currentStackBase === nextStackTopYPos) {
    currentStackTopYPos = currentStackBase;
    currentStackBase = currentDatapointValues.dummyStackBase;
  }

  // We need to flip the y co-ords if one of the datasets is negative and the other isn't
  if (!currentDatapointValues.isPositive && nextDatapointValues.isPositive) {
    nextStackTopYPos = nextStackBase;
    nextStackBase = nextDatapointValues.stackTopYPos;
  }

  if (currentDatapointValues.isPositive && !nextDatapointValues.isPositive) {
    currentStackTopYPos = currentStackBase;
    currentStackBase = currentDatapointValues.stackTopYPos;
  }

  // Draws co-ords on the canvas to allow easier debugging
  if (DEBUG) {
    context.font = '9px Arial';
    context.fillStyle = '#000';
    context.fillText(`TR: ${currentDatapointValues.stackRightXPos.toFixed(0)}`, currentDatapointValues.stackRightXPos, currentStackTopYPos);
    context.fillText(`TL: ${nextDatapointValues.stackLeftXPos.toFixed(0)}`, nextDatapointValues.stackLeftXPos, nextStackTopYPos);
    context.fillText(`BL: ${nextStackBase.toFixed(0)}`, nextDatapointValues.stackLeftXPos, nextStackBase);
    context.fillText(`BR: ${currentStackBase.toFixed(0)}`, currentDatapointValues.stackRightXPos, currentStackBase);
  }

  // Makes sure that each step line is consistent
  const yStart = currentStackTopYPos > nextStackTopYPos ? currentStackTopYPos : nextStackTopYPos;
  const yEnd = currentStackBase > nextStackBase ? currentStackBase : nextStackBase;

  // Gradient from top of second box to bottom of both boxes
  const gradient = context.createLinearGradient(0, yStart, 0, yEnd);

  // Dataset options take priority if they are specified
  const startColor = currentDatapointValues.options.startColor || options.startColor;
  const endColor = currentDatapointValues.options.endColor || options.endColor;
  const startColorStop = currentDatapointValues.options.startColorStop || options.startColorStop;
  const endColorStop = currentDatapointValues.options.endColorStop || options.endColorStop;

  gradient.addColorStop(startColorStop, startColor);
  gradient.addColorStop(endColorStop, endColor);

  context.fillStyle = gradient;

  context.beginPath();

  // top right of first box
  context.lineTo(currentDatapointValues.stackRightXPos, currentStackTopYPos);
  // top left of second box
  context.lineTo(nextDatapointValues.stackLeftXPos, nextStackTopYPos);
  // bottom left of second box
  context.lineTo(nextDatapointValues.stackLeftXPos, nextStackBase);
  // bottom right of first box
  context.lineTo(currentDatapointValues.stackRightXPos, currentStackBase);

  context.fill();
};

export default (chart) => {
  const context = chart.ctx;
  const datasets = chart.data.datasets;
  const options = chart.options.plugins.waterFallPlugin.stepLines;
  const stackedDatasets = groupBy(datasets, 'stack');
  const newDatasets = [];

  const getModel = (dataset) => {
    const firstKey = Object.keys(dataset._meta)[0];

    return dataset._meta[firstKey].data[0]._model;
  };

  Object.keys(stackedDatasets).forEach((key) => {
    const currentStackedDataset = stackedDatasets[key].filter(x => x.data[0] !== 0);

    if (!currentStackedDataset.every(x => x.waterfall.dummyStack)) {
      const nonDummyStacks = currentStackedDataset.filter(dataset => !dataset.waterfall.dummyStack);
      const bases = nonDummyStacks.map(dataset => getModel(dataset).base);
      const lowestBase = Math.max(...bases);

      const dummStackBases = currentStackedDataset.map(dataset => getModel(dataset).base);
      const lowestDummyStackBase = Math.max(...dummStackBases);

      // Loop through each sub stack
      const properties = currentStackedDataset.map((dataset) => {
        const model = getModel(dataset);

        return {
          stackRightXPos: model.x + (model.width / 2),
          stackLeftXPos: model.x - (model.width / 2),
          stackTopYPos: model.y,
          stackBase: lowestBase,
          dummyStackBase: lowestDummyStackBase,
          isPositive: dataset.data[0] > 0,
          options: dataset.waterfall.stepLines,
        };
      });

      newDatasets.push(properties);
    }
  });

  // Gets the values for the steplines at the top of the stack
  const getDatapointsValues = (dataset) => {
    const index = dataset.length - 1;

    return {
      stackRightXPos: dataset[index].stackRightXPos,
      stackLeftXPos: dataset[index].stackLeftXPos,
      stackTopYPos: dataset[index].stackTopYPos,
      stackBase: dataset[index].stackBase,
      dummyStackBase: dataset[index].dummyStackBase,
      isPositive: dataset[index].isPositive,
      options: dataset[index].options,
    };
  };

  for (let i = 0; i < newDatasets.length; i += 1) {
    const currentDataSet = newDatasets[i];

    if (i !== newDatasets.length - 1) {
      const nextDataSet = newDatasets[i + 1];
      const currentDatapointValues = getDatapointsValues(currentDataSet);
      const nextDatapointValues = getDatapointsValues(nextDataSet);

      if (currentDatapointValues.stackTopYPos === nextDatapointValues.stackTopYPos ||
        currentDatapointValues.stackBase === nextDatapointValues.stackTopYPos ||
        currentDatapointValues.stackTopYPos === nextDatapointValues.stackBase) {
        drawOnCanvas(context, options, currentDatapointValues, nextDatapointValues);
      }
    }
  }
};
