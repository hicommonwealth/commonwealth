import m from 'mithril';

import { SnapshotProposal } from 'models';

export const ProposalHeaderTitle: m.Component<{ proposal: SnapshotProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m('.ProposalHeaderTitle', [
      proposal.name
    ]);
  }
};
