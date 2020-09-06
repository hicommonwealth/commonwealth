
import m from 'mithril';
import Chart from 'chart.js';
import 'pages/validatorprofile.scss';

export const chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
};
export const chartbackColors = { // colors with lowered opacity for shadow effect
  red: 'rgb(255, 99, 132,0.1)',
  orange: 'rgb(255, 159, 64,0.1)',
  yellow: 'rgb(255, 205, 86,0.1)',
  green: 'rgb(75, 192, 192,0.1)',
  blue: 'rgb(54, 162, 235,0.1)',
  purple: 'rgb(153, 102, 255,0.1)',
  grey: 'rgb(201, 203, 207,0.1)'
};


export default {
  view(vnode) {
    const model = vnode.attrs.model;
    const xvalues: number[] = vnode.attrs.xvalues;
    const yvalues: number[] = vnode.attrs.yvalues;
    // const title: string = vnode.attrs.title;
    const xLabelString: string = vnode.attrs.xLabelString;
    const yLabelString: string = vnode.attrs.yLabelString;
    const addColorStop0: string = vnode.attrs.addColorStop0;
    const addColorStop1: string = vnode.attrs.addColorStop1;
    const color: string = vnode.attrs.color;
    const title: string = vnode.attrs.title;
    // const labels = vnode.attrs.
    return m('.col-xs-5 .col-xs-offset-1 .graph-container', [
      m('div.row.graph-title', m('p', title)),
      m('#canvas-holder', [
        m('canvas#chart', {
          oncreate({ dom }) {
            // @ts-ignore
            const ctx = dom.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 160);
            gradient.addColorStop(0, addColorStop0);
            gradient.addColorStop(1, addColorStop1);
            model.config.data.datasets[0].borderColor = chartColors[color];
            model.config.data.datasets[0].backgroundColor = gradient;
            model.config.data.labels = xvalues;
            model.config.data.datasets[0].data = yvalues;
            model.config.options.scales.xAxes[0].scaleLabel.labelString = xLabelString;
            model.config.options.scales.yAxes[0].scaleLabel.labelString = yLabelString;
            model.instance = new Chart(ctx, model.config);
            model.loaded = true;
          }
        })
      ]),
    ]);
  }
};


// export default {
//   view(vnode) {
//     const model = vnode.attrs.model;
//     model.config.data.labels = vnode.attrs.x; // values sent to module for X axis
//     model.config.data.datasets[0].data = vnode.attrs.y;// values sent to module for Y axis
//     const title:string  = vnode.attrs.title;
//     return  m('.col-xs-5 .col-xs-offset-1 .graph-container', [
//       m('div.row.graph-title', m('p', title)),
//       m('#canvas-holder', [
//         m(`canvas#chart${title}`, {
//           oncreate() {
//             console.log(`${title}####`);
//             const canvas = <HTMLCanvasElement>document.getElementById(`chart${title}`); // access created canvas
//             const ctx = canvas.getContext('2d');
//             const gradient = ctx.createLinearGradient(0, 0, 0, 160);
//             gradient.addColorStop(0, 'rgba(53, 212, 19, 0.23)');
//             gradient.addColorStop(1, 'rgba(53, 212, 19, 0)');
//             model.config.data.datasets[0].borderColor = chartColors.green;
//             model.config.data.datasets[0].backgroundColor = gradient;
//             model.instance = new Chart(ctx, model.config);
//             model.loaded = true;
//             m.redraw();
//           }
//         }),
//       ])
//     ]);
//   }
// };
