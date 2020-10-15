import 'components/proposals_loading_row.scss';

import m from 'mithril';

const ProposalsLoadingRow: m.Component<{}> = {
  view: (vnode) => {
    return m('.ProposalsLoadingRow', [
      m('.proposal-row', [
        m('.proposal-left', [
          m('.title-block'),
          m('br'),
          m('.metadata-block'),
        ]),
        m('.proposal-center', [
          m('.content-block'),
          m('.content-block'),
          m('.content-block'),
        ]),
      ]),
    ]);
  }
};

export default ProposalsLoadingRow;
