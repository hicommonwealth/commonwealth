import 'components/row.scss';

import m, { VnodeDOM } from 'mithril';
import Chart from 'chart.js';
import moment from 'moment-twitter';

import app from 'state';

interface IRowAttrs {
  contentLeft: IContentLeft;
  metadata: VnodeDOM[] | string[];
  onclick: Function;
}

interface IContentLeft {
  header: VnodeDOM;
  subheader: VnodeDOM;
}

const Row: m.Component<IRowAttrs> = {
  view: (vnode) => {
    const { onclick, metadata, contentLeft } = vnode.attrs;
    const attrs = {};
    if (onclick) attrs['onclick'] = onclick;
    return m('.Row', attrs, [
      m('.row-left', [
        m('.row-header', contentLeft.header),
        m('.row-subheader', contentLeft.subheader),
      ]),
      m('.row-right', [
        metadata
      ])
    ]);
  }
};

export default Row;
