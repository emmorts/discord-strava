window.drawChart = function (config) {
  const ctx = document.getElementById('monthly-chart').getContext('2d');

  if (window.leaderboardType === 3) {
    config.options.scales.y.ticks.precision = 3;
    config.options.scales.y.ticks.callback = (value) => {
      const paceMinutes = ~~value;
      const paceSeconds = ~~(value % 1 * 60);
    
      return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
    }
    config.options.scales.y.reverse = true;
  }

  window.chart = new Chart(ctx, config);

  loadAnnotations(config.data);
}

function loadAnnotations(data) {
  let photosLoaded = 0;
  
  return data.datasets.map(dataset => {
    const image = document.createElement('img')
    image.src = dataset.imageUrl;
    image.onload = () => {
      photosLoaded++;

      if (!window.chart.options.plugins.annotation.annotations.length) {
        window.chart.options.plugins = {
          annotation: {
            annotations: []
          }
        };
      }

      const lastDataPointIndex = getLastExistingDataPointIndex(dataset.data);
      const closeToLeftBorder = lastDataPointIndex < 5;
      const closeToRightBorder = lastDataPointIndex > (data.labels.length - 4);
      const xAdjust = closeToRightBorder
        ? -10 : closeToLeftBorder
        ? 10 : 0;

      window.chart.options.plugins.annotation.annotations.push({
        type: 'label',
        drawTime: 'afterDraw',
        content: image,
        width: 20,
        height: 20,
        xAdjust: xAdjust,
        xValue: data.labels[lastDataPointIndex],
        yValue: dataset.data[lastDataPointIndex]
      });

      if (photosLoaded === data.datasets.length) {
        window.chart.update()
      }
    }
  });
}

function getLastExistingDataPointIndex(data) {
  let index = 0;

  for (let i = 0; i < data.length; i++) {
    if (data[i] !== null) {
      index = i;
    }
  }

  return index;
}