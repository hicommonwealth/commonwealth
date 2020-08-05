
import m from 'mithril';
import Chart from 'chart.js';

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
