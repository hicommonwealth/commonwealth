import 'components/proposals/aave_detail.scss';

import AaveProposal from 'client/scripts/controllers/chain/ethereum/aave/proposal';
import m from 'mithril';
import User from '../widgets/user';

export const roundVote = (percentage) => {
  return percentage.toFixed(2).split('.0')[0].slice(0, 4);
};

const AaveProposalCardDetail = {
  view: (vnode: m.Vnode<{ proposal: AaveProposal, statusClass: string, statusText: any }>) => {
    const { proposal, statusClass, statusText } = vnode.attrs;
    // TODO: move executor display to entire page
    // TODO: display stats about voting turnout/etc
    const executor = proposal.Executor;
    return m('.AaveProposalCardDetail', {
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    }, [
      m('.aave-metadata', [
        m('.aave-author', [
          m('.card-subheader', 'Author'),
          proposal.ipfsData?.author
            ? proposal.ipfsData.author.split(' (').map((ele, idx) => {
              return idx === 0
                ? m('p.collapsed-line-height', ele)
                : m('p.card-subheader', ele.slice(0, ele.length - 1));
            })
            : m(User, { user: proposal.author, popover: true }),
        ]),
        m('.aave-status', [
          m('.card-subheader', 'Status'),
          m('.proposal-injected-status', { class: statusClass }, statusText),
        ]),
      ]),
      m('.aave-voting', [
        m('.card-subheader', 'Voting'),
        m('.aave-turnout', [
          m('p.detail-highlight.emphasize', [
            roundVote(proposal.turnout * 100),
            '%',
          ]),
          m('p', ' of token holders'),
        ]),
        m('.aave-support', [
          m('p.detail-highlight.emphasize', [
            roundVote(proposal.support * 100),
            '%',
          ]),
          m('p', ' in favor'),
        ]),
        m('.aave-differential', [
          m('p.detail-highlight.emphasize', [
            roundVote(proposal.voteDifferential * 100),
            '%',
          ]),
          m('p', ' differential'),
        ]),
      ]),
      m('.aave-requirements', [
        m('.card-subheader', 'Required to pass'),
        m('.aave-turnout-requirement', [
          m('p.detail-highlight.emphasize', [
            (proposal.minimumQuorum * 100),
            '%',
          ]),
          m('p', ' of token holders'),
        ]),
        m('.aave-differential-requirement', [
          m('p.detail-highlight.emphasize', [
            (proposal.minimumVoteDifferential * 100),
            '%',
          ]),
          m('p', ' differential')
        ])
      ])
    ]);
  }
};

export default AaveProposalCardDetail;
