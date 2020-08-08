
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
export const chartbackColors = {
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

    return m(`.${model.config.type}`, [
       m('.row', [
         
        m('.col-xs-6', [
      m('#canvas-holder', [
        m('canvas#chart', {
          oncreate(vnode) {
            const canvas = <HTMLCanvasElement> document.getElementById('chart'); // access created canvas
            const ctx = canvas.getContext('2d');
            ctx.shadowBlur = 20;
            ctx.shadowColor = "black";
            model.config.data.datasets[0].borderColor = chartColors.green;
            model.config.data.datasets[0].backgroundColor = chartbackColors.green;
            model.instance = new Chart(ctx, model.config);
            m.redraw();
          }
        }),
      ])
    ])   
        ,

        m('.col-xs-6', [
      m('#canvas-holder', [
      m('canvas#chart1', {
        oncreate(vnode) {
          const canvas = <HTMLCanvasElement> document.getElementById('chart1'); 
          const ctx = canvas.getContext('2d');
          model.config.data.labels = [1, 2, 3, 2, 1, 0];
          model.config.data.datasets[0].data = [1, 250, 250, 2, 1, 0];
          model.config.data.datasets[0].borderColor = chartColors.red;
          model.config.data.datasets[0].backgroundColor = chartbackColors.red;
          model.instance = new Chart(ctx, model.config);
          m.redraw();
        }
      })
    ])
   ])
    
      ,
    ]),
    m('.row', [
         
      m('.col-xs-6', [
    m('#canvas-holder', [
      m('canvas#chart2', {
        oncreate(vnode) {
          const canvas = <HTMLCanvasElement> document.getElementById('chart2'); // access created canvas
          const ctx = canvas.getContext('2d');
          model.config.data.labels = [1, 2, 3, 2, 1, 0];
          model.config.data.datasets[0].data = [7, 300, 4, 2, 0, 250];
          model.config.data.datasets[0].borderColor = chartColors.purple;
          model.config.data.datasets[0].backgroundColor = chartbackColors.purple;
          model.instance = new Chart(ctx, model.config);
          m.redraw();
        }
      }),
    ])
  ])   
      ,

      m('.col-xs-6', [
    m('#canvas-holder', [
    m('canvas#chart3', {
      oncreate(vnode) {
        const canvas = <HTMLCanvasElement> document.getElementById('chart3'); 
        const ctx = canvas.getContext('2d');
        model.config.data.labels = [1, 2, 3, 2, 1, 0];
        model.config.data.datasets[0].data = [2, 6, 4, 4, 300, 250];
        model.config.data.datasets[0].borderColor = chartColors.yellow;
        model.config.data.datasets[0].backgroundColor = chartbackColors.yellow;
        model.instance = new Chart(ctx, model.config);
        m.redraw();
      }
    })
  ])
 ])
  
    ,
  ]),
  m('.row', [
         
    m('.col-xs-6', [
  m('#canvas-holder', [
    m('canvas#chart4', {
      oncreate(vnode) {
        const canvas = <HTMLCanvasElement> document.getElementById('chart4'); // access created canvas
        const ctx = canvas.getContext('2d');
        model.config.data.labels = [1, 2, 3, 2, 1, 0];
        model.config.data.datasets[0].data = [300, 6, 1, 2, 250, 10];
        model.config.data.datasets[0].borderColor = chartColors.orange;
        model.config.data.datasets[0].backgroundColor = chartbackColors.orange;
        model.instance = new Chart(ctx, model.config);
        m.redraw();
      }
    }),
  ])
])   
    ,

    m('.col-xs-6', [
  m('#canvas-holder', [
  m('canvas#chart5', {
    oncreate(vnode) {
      const canvas = <HTMLCanvasElement> document.getElementById('chart5'); 
      const ctx = canvas.getContext('2d');
      model.config.data.labels = [1, 2, 3, 2, 1, 0];
      model.config.data.datasets[0].data = [300, 250, 4, 2, 1, 2];
      model.config.data.datasets[0].borderColor = chartColors.blue;
      model.config.data.datasets[0].backgroundColor = chartbackColors.blue;
      model.instance = new Chart(ctx, model.config);
      m.redraw();
    }
  })
])
])

  ,
]),
m('.row', [
         
  m('.col-xs-6', [
m('#canvas-holder', [
  m('canvas#chart6', {
    oncreate(vnode) {
      const canvas = <HTMLCanvasElement> document.getElementById('chart6'); // access created canvas
      const ctx = canvas.getContext('2d');
      model.config.data.labels = [1, 2, 3, 2, 1, 0];
      model.config.data.datasets[0].data = [7, 6, 3, 150, 300, 3];
      model.config.data.datasets[0].borderColor = chartColors.grey;
      model.config.data.datasets[0].backgroundColor = chartbackColors.grey;
      model.instance = new Chart(ctx, model.config);
      m.redraw();
    }
  }),
])
])   
  ,
,
])

  ]);
  }
};


