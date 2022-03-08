import m from 'mithril';

import { SnapshotProposal } from 'helpers/snapshot_utils';

export const ProposalHeaderTitle: m.Component<{ proposal: SnapshotProposal }> =
  {
    view: (vnode) => {
      const { proposal } = vnode.attrs;
      if (!proposal) return;
      return m('.ProposalHeaderTitle', [proposal.title]);
    },
  };
