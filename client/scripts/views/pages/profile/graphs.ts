'use strict';

import m from 'mithril';

import lineModel from './graph_models/linemodel'

import chartComponent from '../../components/chart';

function renderChart(model,xValues,yValues) {
  return model.loaded
    ? m('.column', m(chartComponent, { model: model,x:xValues,y:yValues }))
    : m('.column.has-text-centered', 'Loading...');
}

const graphContent: m.Component<{ xValues: string[],yValues: number[]}> = {
  view(vnode) {
    const { xValues, yValues } = vnode.attrs;
    return [
      m('h1.title.has-text-centered', 'Line Charts'),
      m('.columns', [
        renderChart(lineModel,xValues,yValues),
      ]
      )
    ];
  }
};
export default graphContent;