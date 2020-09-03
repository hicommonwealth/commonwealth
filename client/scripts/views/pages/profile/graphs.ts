
import m from 'mithril';

import lineModel from './graph_models/linemodel';

import chartComponent from '../../components/chart';

function renderChart(model, xValues, yValues, title) {
  return model.loaded
    ? m('.column', m(chartComponent, { model, x:xValues, y:yValues, title }))
    : m('.column.has-text-centered', 'Loading...');
}

const graphContent: m.Component<{ xValues: number[], yValues: number[], title:string }> = {
  view(vnode) {
    const { xValues, yValues, title } = vnode.attrs;
    return [
      m('.columns', [
        renderChart(lineModel, xValues, yValues, title)
      ]),
    ];
  }
};
export default graphContent;
