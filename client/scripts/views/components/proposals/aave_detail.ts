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
      m('.proposal-injected-status', { class: statusClass }, statusText),
      m('p', [
        m('b', [
          proposal.ipfsData?.shortDescription || '',
        ]),
      ]),
      m('p', [
        m('b', [
          'Author: ',
          // TODO: format as User
          proposal.ipfsData?.author || proposal.data.proposer,
        ]),
      ]),
      m('p', [
        'Support: ',
        proposal.support,
        '%',
      ]),
      m('p', [
        'Turnout: ',
        proposal.turnout,
        '%',
      ]),
      m('p', [
        'Required Quorum: ',
        proposal.minimumQuorum * 100,
        '% (of total supply)',
      ]),
      m('p', [
        'Required Vote differential: ',
        proposal.voteDifferential * 100,
        '%',
      ]),
    ]);
  }
};

export default AaveDetail;
