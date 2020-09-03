
import m from 'mithril';
import Chart from 'chart.js';

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
    model.config.data.labels = vnode.attrs.x; // values sent to module for X axis
    model.config.data.datasets[0].data = vnode.attrs.y;// values sent to module for Y axis
    const title:string  = vnode.attrs.title;
    return m(`.${model.config.type}`, [
      m('.col-xs-6', [
        m('#canvas-holder', [
          m(`canvas#chart${title}`, {
            oncreate() {
              console.log(title+'####');
              const canvas = <HTMLCanvasElement>document.getElementById(`chart${title}`); // access created canvas
              const ctx = canvas.getContext('2d');
              const gradient = ctx.createLinearGradient(0, 0, 0, 105);
              gradient.addColorStop(0, 'rgba(53, 212, 19, 0.23)');
              gradient.addColorStop(1, 'rgba(53, 212, 19, 0)');
              model.config.data.datasets[0].borderColor = chartColors.green;
              model.config.data.datasets[0].backgroundColor = gradient;
              model.config.options.title.text = title;
              model.instance = new Chart(ctx, model.config);
              model.loaded = true;
              m.redraw();
            }
          }),
        ])
      ]),
    ]);
  }
};
