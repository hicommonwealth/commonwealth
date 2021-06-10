import 'components/proposals/aave_detail.scss';

import AaveProposal from 'client/scripts/controllers/chain/ethereum/aave/proposal';
import m from 'mithril';
import moment from 'moment';

const AaveDetail = {
  view: (vnode: m.Vnode<{ proposal: AaveProposal }>) => {
    const { proposal } = vnode.attrs;
    const executor = proposal.Executor;
    return m('.AaveProposalDetail', {
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    }, [
      m('p', [
        m('b', [
          proposal.ipfsData.shortDescription,
        ]),
      ]),
      m('p', [
        m('b', [
          'Author: ',
          proposal.ipfsData.author,
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
