import 'components/row.scss';

import m, { VnodeDOM, Vnode } from 'mithril';
import Chart from 'chart.js';
import moment from 'moment-twitter';

import app from 'state';

interface IRowAttrs {
  contentLeft: IContentLeft;
  metadata: Vnode[];
  key?: number;
  onclick?: Function;
}

interface IContentLeft {
  header: Vnode;
  subheader: Vnode;
}

const Row: m.Component<IRowAttrs> = {
  view: (vnode) => {
    const { key, onclick, metadata, contentLeft } = vnode.attrs;
    const attrs = {};
    if (onclick) attrs['onclick'] = onclick;
    if (key) attrs['key'] = key;
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
