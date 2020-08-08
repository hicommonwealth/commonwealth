
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
        label: '',
        backgroundColor: "rgba(255, 10, 13, 0.1)",
        borderColor: chartColors.red,
        yValues: [1, 2],
      }, ]
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
      legend:{
        display:false
      },
      scales: {
        xAxes: [{
          display: true,
          scaleLabel: {
            display: true,
            labelString: ''
          }
        }],
        yAxes: [{
          ticks: {
            fontSize: 10
        },
          display: true,
          scaleLabel: {
            display: true,
            labelString: '',
           
          }
          
        }]
      }
    }
  }
};


