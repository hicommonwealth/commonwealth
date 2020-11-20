
import m from 'mithril';
import Chart from 'chart.js';
import 'pages/validatorprofile.scss';

export default {
  view(vnode) {
    const model = vnode.attrs.model;
    const xvalues: number[] = vnode.attrs.xvalues;
    const yvalues: number[] = vnode.attrs.yvalues;
    const xLabelString: string = vnode.attrs.xLabelString;
    const yLabelString: string = vnode.attrs.yLabelString;
    const addColorStop0: string = vnode.attrs.addColorStop0;
    const addColorStop1: string = vnode.attrs.addColorStop1;
    const color: string = vnode.attrs.color;
    const title: string = vnode.attrs.title;
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
            model.config.data.datasets[0].borderColor = color;
            model.config.data.datasets[0].backgroundColor = gradient;
            model.config.data.labels = xvalues;
            model.config.data.datasets[0].data = yvalues;
            model.instance = new Chart(ctx, model.config);
            model.loaded = true;
          }
        })
      ]),
    ]);
  }
};
