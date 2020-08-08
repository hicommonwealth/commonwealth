
import m from 'mithril';

import lineModel from './graph_models/linemodel';

import chartComponent from '../../components/chart';

function renderChart(model, xValues, yValues,titles) {
  return model.loaded
    ? m('.column', m(chartComponent, { model, x:xValues, y:yValues,names:titles }))
    : m('.column.has-text-centered', 'Loading...');
}

const graphContent: m.Component<{ xValues: number[], yValues: number[],titles:string[] }> = {
  view(vnode) {
    const { xValues, yValues,titles } = vnode.attrs;
    return [
      m('.columns', [
        renderChart(lineModel, xValues, yValues,titles)
      ]),
    ];
  }
};
export default graphContent;
