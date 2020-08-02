'use strict';

import m from 'mithril';

export const chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};


export default {
  loaded: true,
  config: {
    type: 'line',
    data: {
      xValues: [],
      datasets: [{
        label: 'values',
        backgroundColor: chartColors.red,
        borderColor: chartColors.red,
        yValues: [1,2],
        fill: false,
      },]
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: 'Declared values'
      },
      tooltips: {
        mode: 'point',
        intersect: true,
      },
      hover: {
        mode: 'point',
        intersect: true
      },
      scales: {
        xAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Xvalues'
          }
        }],
        yAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: 'Yvalues'
          }
        }]
      }
    }
  }
};