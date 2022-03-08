import 'components/loading_row.scss';

import m from 'mithril';

const LoadingRow: m.Component<{}> = {
  view: (vnode) => {
    return m('.LoadingRow', [
      m('.proposal-row', [
        m('.proposal-left', [m('.title-block'), m('br'), m('.metadata-block')]),
        m('.proposal-center', [
          m('.content-block'),
          m('.content-block'),
          m('.content-block'),
        ]),
      ]),
    ]);
  },
};

export default LoadingRow;
