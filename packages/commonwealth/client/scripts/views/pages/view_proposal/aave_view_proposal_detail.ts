import AaveProposal from 'client/scripts/controllers/chain/ethereum/aave/proposal';
import m from 'mithril';
import { roundVote } from '../../components/proposals/aave_proposal_card_detail';

export const AaveViewProposalDetail: m.Component<{ proposal: AaveProposal }, {}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    return m('.AaveViewProposalDetail', {
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    }, [
      m('h3', 'Voting'),
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
      m('.aave-turnout-requirement', [
        m('p.detail-highlight.emphasize', [
          (proposal.minimumQuorum * 100),
          '%',
        ]),
        m('p', ' of token holders required to pass'),
      ]),
      m('.aave-differential-requirement', [
        m('p.detail-highlight.emphasize', [
          (proposal.minimumVoteDifferential * 100),
          '%',
        ]),
        m('p', ' differential required to pass')
      ])
    ]);
  }
};

export const AaveViewProposalSummary: m.Component<{ proposal: AaveProposal }, {}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal.ipfsData?.shortDescription) return;
    return m('.AaveViewProposalSummary', {
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    }, [
      m('h3', 'Simple Summary'),
      m('.aave-summary', proposal.ipfsData?.shortDescription)
    ]);
  }
};
