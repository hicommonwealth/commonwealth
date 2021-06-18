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
        'Executor: ',
        executor.address,
      ]),
      m('p', [
        'Delay (H:m:s): ',
        moment.unix(executor.delay).format('HH:mm:ss'),
      ]),
      m('p', [
        'Quorum (% of total supply): ',
        +executor.minimumQuorum / 10000,
      ]),
      m('p', [
        'Vote differential (% success): ',
        +executor.voteDifferential / 10000,
      ]),
    ]);
  }
};

export default AaveDetail;
