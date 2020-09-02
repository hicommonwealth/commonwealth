
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
    const names = vnode.attrs.names;
    return m(`.${model.config.type}`, [
      m('.row', [

        m('.col-xs-6', [
          m('#canvas-holder', [
            m('canvas#chart', {
              oncreate(vnode) {
                const canvas = <HTMLCanvasElement>document.getElementById('chart'); // access created canvas
                const ctx = canvas.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, 105);
                gradient.addColorStop(0, 'rgba(53, 212, 19, 0.23)');
                gradient.addColorStop(1, 'rgba(53, 212, 19, 0)');
                // ctx.shadowBlur = 20;
                // ctx.shadowColor = "black";
                model.config.data.datasets[0].borderColor = chartColors.green;
                model.config.data.datasets[0].backgroundColor = gradient;
                model.config.options.title.text = names[0];
                model.instance = new Chart(ctx, model.config);
                m.redraw();
              }
            }),
          ])
        ]),

        m('.col-xs-6', [
          m('#canvas-holder', [
            m('canvas#chart1', {
              oncreate(vnode) {
                const canvas = <HTMLCanvasElement>document.getElementById('chart1');
                const ctx = canvas.getContext('2d');
                model.config.data.labels = [403, 406, 409, 412, 415, 418, 430, 433, 436, 439, 452, 455, 458, 461, 471];
                model.config.data.datasets[0].data = [500, 325, 600, 350, 400, 380, 690, 800, 1000, 1600, 1200, 1150, 1300, 1400, 1400]; // hardcoded values for the time being
                const gradient = ctx.createLinearGradient(0, 0, 0, 105);
                gradient.addColorStop(0, 'rgba(99, 113, 209, 0.23)');
                gradient.addColorStop(1, 'rgba(99, 113, 209, 0)');
                model.config.data.datasets[0].borderColor = chartColors.blue;
                model.config.data.datasets[0].backgroundColor = gradient;
                model.config.options.title.text = names[1];
                model.instance = new Chart(ctx, model.config);
                m.redraw();
              }
            })
          ])
        ]),

      ]),
      m('.row', [

        m('.col-xs-6', [
          m('#canvas-holder', [
            m('canvas#chart2', {
              oncreate(vnode) {
                const canvas = <HTMLCanvasElement>document.getElementById('chart2'); // access created canvas
                const ctx = canvas.getContext('2d');
                model.config.data.labels = [403, 406, 409, 412, 415, 418, 430, 433, 436, 439, 452, 455, 458, 461, 471];
                model.config.data.datasets[0].data = [500, 325, 600, 350, 400, 380, 690, 800, 1000, 1600, 1200, 1150, 1300, 1400, 1400];
                const gradient = ctx.createLinearGradient(0, 0, 0, 105);
                gradient.addColorStop(0, 'rgba(153, 102, 255,0.23)');
                gradient.addColorStop(1, 'rgba(153, 102, 255,0)');
                model.config.data.datasets[0].borderColor = chartColors.purple;
                model.config.data.datasets[0].backgroundColor = gradient;
                model.config.options.title.text = names[2];
                model.instance = new Chart(ctx, model.config);
                m.redraw();
              }
            }),
          ])
        ]),

        m('.col-xs-6', [
          m('#canvas-holder', [
            m('canvas#chart3', {
              oncreate(vnode) {
                const canvas = <HTMLCanvasElement>document.getElementById('chart3');
                const ctx = canvas.getContext('2d');
                model.config.data.labels = [403, 406, 409, 412, 415, 418, 430, 433, 436, 439, 452, 455, 458, 461, 471];
                model.config.data.datasets[0].data = [500, 325, 600, 350, 400, 380, 690, 800, 1000, 1600, 1200, 1150, 1300, 1400, 1400];
                const gradient = ctx.createLinearGradient(0, 0, 0, 105);
                gradient.addColorStop(0, 'rgba(255, 205, 86,0.23)');
                gradient.addColorStop(1, 'rgba(255, 205, 86,0)');
                model.config.data.datasets[0].borderColor = chartColors.yellow;
                model.config.data.datasets[0].backgroundColor = gradient;
                model.config.options.title.text = names[3];
                model.instance = new Chart(ctx, model.config);
                m.redraw();
              }
            })
          ])
        ]),

      ]),
      m('.row', [

        m('.col-xs-6', [
          m('#canvas-holder', [
            m('canvas#chart4', {
              oncreate(vnode) {
                const canvas = <HTMLCanvasElement>document.getElementById('chart4'); // access created canvas
                const ctx = canvas.getContext('2d');
                model.config.data.labels = [403, 406, 409, 412, 415, 418, 430, 433, 436, 439, 452, 455, 458, 461, 471];
                model.config.data.datasets[0].data = [500, 325, 600, 350, 400, 380, 690, 800, 1000, 1600, 1200, 1150, 1300, 1400, 1400];
                const gradient = ctx.createLinearGradient(0, 0, 0, 105);
                gradient.addColorStop(0, 'rgba(255, 159, 64,0.23)');
                gradient.addColorStop(1, 'rgba(255, 159, 64,0)');
                model.config.data.datasets[0].borderColor = chartColors.orange;
                model.config.data.datasets[0].backgroundColor = gradient;
                model.config.options.title.text = names[4];
                model.instance = new Chart(ctx, model.config);
                m.redraw();
              }
            }),
          ])
        ]),

        m('.col-xs-6', [
          m('#canvas-holder', [
            m('canvas#chart5', {
              oncreate(vnode) {
                const canvas = <HTMLCanvasElement>document.getElementById('chart5');
                const ctx = canvas.getContext('2d');
                model.config.data.labels = [403, 406, 409, 412, 415, 418, 430, 433, 436, 439, 452, 455, 458, 461, 471];
                model.config.data.datasets[0].data = [500, 325, 600, 350, 400, 380, 690, 800, 1000, 1600, 1200, 1150, 1300, 1400, 1400];
                const gradient = ctx.createLinearGradient(0, 0, 0, 105);
                gradient.addColorStop(0, 'rgba(99, 113, 209, 0.23)');
                gradient.addColorStop(1, 'rgba(99, 113, 209, 0)');
                model.config.data.datasets[0].borderColor = chartColors.blue;
                model.config.data.datasets[0].backgroundColor = gradient;
                model.config.options.title.text = names[5];
                model.instance = new Chart(ctx, model.config);
                m.redraw();
              }
            })
          ])
        ]),

      ]),
      m('.row', [

        m('.col-xs-6', [
          m('#canvas-holder', [
            m('canvas#chart6', {
              oncreate(vnode) {
                const canvas = <HTMLCanvasElement>document.getElementById('chart6'); // access created canvas
                const ctx = canvas.getContext('2d');
                model.config.data.labels = [403, 406, 409, 412, 415, 418, 430, 433, 436, 439, 452, 455, 458, 461, 471];
                model.config.data.datasets[0].data = [500, 325, 600, 350, 400, 380, 690, 800, 1000, 1600, 1200, 1150, 1300, 1400, 1400];
                const gradient = ctx.createLinearGradient(0, 0, 0, 105);
                gradient.addColorStop(0, 'rgba(201, 203, 207,0.23)');
                gradient.addColorStop(1, 'rgba(201, 203, 207,0)');
                model.config.data.datasets[0].borderColor = chartColors.grey;
                model.config.data.datasets[0].backgroundColor = chartbackColors.grey;
                model.config.options.title.text = names[6];
                model.instance = new Chart(ctx, model.config);
                m.redraw();
              }
            }),
          ])
        ])
      ])

    ]);
  }
};
