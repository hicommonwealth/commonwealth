import m from 'mithril';
import { ALIGN_CENTER, ALIGN_LEFT } from 'construct-ui/lib/esm/components/icon/generated/IconNames';

export const chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};

export default (yMax?, yMin?, yStepSize?) => {
  return {
    loaded: false,
    config: {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: '',
          fill: true,
          pointBackgroundColor: '#fff',
          borderColor: chartColors.red,
          pointRadius: 0, // size of points
          borderWidth: 2, // line width
          lineTension: 0.2,
          data: [],
          /* point options */

          pointBorderWidth: 2, // size of outer circle
        }]
      },
      options: {
        responsive: true,
        tooltips: {
          enabled: false
        },
        bezierCurve: true,
        // hover: {
        //   mode: 'point',
        //   intersect: false,
        // },
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            offset: true,
            display: true,
            ticks: {
              padding: 10,
              maxRotation: 0,
              minRotation: 0,

              fontFamily: 'Inter',
              fontColor: '#B0BAC9',
              beginAtZero: true,
              fontSize: 10,
              fontStyle: 'normal',
              fontWeight: 500,
              // lineHeight: 120,
              letterSpacing: -0.5,
              // stepSize: 1,
              // min: 0,
              // max: 100,
              callback: (tick, index, ticks) => {
                if (index % 2 === 0)
                  return tick.toLocaleString();
                return null;
              }
            },
            gridLines: {
              display: false
            }
          }],
          yAxes: [{
            display: true,
            ticks: {
              fontFamily: 'Inter',
              fontColor: '#B0BAC9',
              fontSize: 12,
              // stepSize: 1000000,
              // suggestedMin: 0,    // minimum will be 0, unless there is a lower value.
              // OR //
              // beginAtZero: true,  // minimum value will be 0.
              padding: 1,
              min: yMin,
              stepSize: yStepSize,
              max: yMax,
            },
            gridLines: {
              display: false
            }
          }]
        },
      }
    }
  };
};
