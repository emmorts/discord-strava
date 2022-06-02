window.drawChart = function (config) {
  const ctx = document.getElementById('monthly-chart').getContext('2d');

  config.options.plugins = {
    annotation: {
      annotations: getAnnotations(config.data)
    }
  }

  new Chart(ctx, config);
}

function getAnnotations(data) {
  return data.datasets.map(dataset => {
    const image = new Image();
    image.src = dataset.imageUrl;

    return {
      type: 'label',
      drawTime: 'afterDraw',
      content: image,
      width: 40,
      height: 40,
      xAdjust: -20,
      xValue: data.labels[data.labels.length - 1],
      yValue: dataset.data[dataset.data.length - 1]
    }
  });
}