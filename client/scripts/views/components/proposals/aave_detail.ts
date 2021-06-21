import 'components/proposals/aave_detail.scss';

import AaveProposal from 'client/scripts/controllers/chain/ethereum/aave/proposal';
import m from 'mithril';
import moment from 'moment';

const AaveDetail = {
  view: (vnode: m.Vnode<{ proposal: AaveProposal, statusClass: string, statusText: any }>) => {
    const { proposal, statusClass, statusText } = vnode.attrs;
    // TODO: move executor display to entire page
    // TODO: display stats about voting turnout/etc
    const executor = proposal.Executor;
    return m('.AaveProposalDetail', {
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    }, [
      m('p', [
        m('.card-subheader.proposal-description', [
          proposal.ipfsData?.shortDescription || '',
        ]),
      ]),
      m('.aave-metadata', [
        m('div', [
          m('.card-subheader', 'Author'),
          m('p', [
            m('.detail-highlight', [
              // TODO: format as User
              proposal.ipfsData?.author || proposal.data.proposer,
            ]),
          ]),
        ]),
        m('div', [
          m('.card-subheader', 'Status'),
          m('.proposal-injected-status', { class: statusClass }, statusText),
        ]),
      ]),
      m('.aave-voting', [
        m('.card-subheader', 'Voting'),
        m('p', [
          m('.detail-highlight.emphasize', [
            proposal.support,
            '%',
          ]),
          ' in favor',
        ]),
        proposal.turnout
        && m('p', [
          m('.detail-highlight.emphasize', [
            proposal.turnout,
            '%',
          ]),
          ' of token holders voted',
        ]),
      ]),
      m('.aave-requirements', [
        m('.card-subheader', 'Required to pass'),
        m('p', [
          m('.detail-highlight.emphasize', [
            proposal.minimumQuorum * 100,
            '%',
          ]),
          ' of token holders',
        ]),
        m('p', [
          m('.detail-highlight.emphasize', [
            proposal.voteDifferential * 100,
            '%',
          ]),
          ' differential'
        ]),
      ])
    ]);
  }
};

export default AaveDetail;
