import AaveProposal from 'client/scripts/controllers/chain/ethereum/aave/proposal';
import m from 'mithril';
import { roundVote } from '../../components/proposals/aave_detail';

export const AaveProposalDetail: m.Component<{ proposal: AaveProposal }, {}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    return m('.AaveProposalDetail', {
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    }, [
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
