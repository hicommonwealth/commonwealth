import 'components/row.scss';

import m, { VnodeDOM, Vnode } from 'mithril';
import Chart from 'chart.js';
import moment from 'moment-twitter';

import app from 'state';
import { Grid, Col } from 'construct-ui';

interface IRowAttrs {
  contentLeft: IContentLeft;
  contentRight: Vnode[];
  rightColSpacing: number[];
  class?: string;
  key?: number;
  onclick?: Function;
}

interface IContentLeft {
  header: Vnode | Vnode[];
  subheader: Vnode | Vnode[];
}

const Row: m.Component<IRowAttrs> = {
  view: (vnode) => {
    const { key, onclick, contentLeft, contentRight, rightColSpacing } = vnode.attrs;
    const attrs = {};
    if (onclick) attrs['onclick'] = onclick;
    if (key) attrs['key'] = key;
    if (vnode.attrs.class) attrs['class'] = vnode.attrs.class;
    const initialOffset = 12 - rightColSpacing.reduce((t, n) => t + n);
    return m('.Row', attrs, [
      m('.row-left', [
        m('.row-header', contentLeft.header),
        m('.row-subheader', contentLeft.subheader),
      ]),
      m('.row-right', [
        m(Grid, contentRight.map((ele, idx) => {
          return m(Col, {
            span: rightColSpacing[idx],
            offset: initialOffset > 0 && idx === 0
              ? initialOffset
              : 0
          }, ele);
        }))
      ])
    ]);
  }
};

export default Row;
