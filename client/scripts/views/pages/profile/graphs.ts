
import m from 'mithril';

import lineModel from './graph_models/linemodel';

import chartComponent from '../../components/chart';

function renderChart(model, xValues, yValues) {
  return model.loaded
    ? m('.column', m(chartComponent, { model, x:xValues, y:yValues }))
    : m('.column.has-text-centered', 'Loading...');
}

const graphContent: m.Component<{ xValues: number[], yValues: number[]}> = {
  view(vnode) {
    const { xValues, yValues } = vnode.attrs;
    return [
      m('.columns', [
        renderChart(lineModel, xValues, yValues),
      ]),
    ];
  }
};
export default graphContent;
