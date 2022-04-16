/* @jsx m */

import m from 'mithril';

// import 'pages/view_proposal/proposal_header_links.scss';

import { link, externalLink, extractDomain } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import { OffchainThread, OffchainThreadKind, AnyProposal } from 'models';
import { ProposalType } from 'types';
import { SnapshotProposal } from 'client/scripts/helpers/snapshot_utils';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

export class ProposalHeaderExternalLink
  implements
    m.ClassComponent<{
      proposal: AnyProposal | OffchainThread;
    }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;
    if (proposal.kind !== OffchainThreadKind.Link) return;

    return (
      <div class="ProposalHeaderExternalLink">
        {externalLink('a.external-link', proposal.url, [
          extractDomain(proposal.url),
          <CWIcon iconName="externalLink" />,
        ])}
      </div>
    );
  }
}

export const ProposalHeaderBlockExplorerLink: m.Component<{
  proposal: AnyProposal;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal || !proposal['blockExplorerLink']) return;
    return m('.ProposalHeaderBlockExplorerLink', [
      externalLink('a.voting-link', proposal['blockExplorerLink'], [
        proposal['blockExplorerLinkLabel'] ||
          extractDomain(proposal['blockExplorerLink']),
        m(CWIcon, { iconName: 'externalLink' }),
      ]),
    ]);
  },
};

export const ProposalHeaderExternalSnapshotLink: m.Component<{
  proposal: SnapshotProposal;
  spaceId: string;
}> = {
  view: (vnode) => {
    const { proposal, spaceId } = vnode.attrs;
    if (!proposal || !proposal.id || !spaceId) return;

    return m('.ProposalHeaderBlockExplorerLink', [
      externalLink(
        'a.voting-link',
        `https://snapshot.org/#/${spaceId}/proposal/${proposal.id}`,
        [`View on Snapshot`, m(CWIcon, { iconName: 'externalLink' })]
      ),
    ]);
  },
};

export const ProposalHeaderVotingInterfaceLink: m.Component<{
  proposal: AnyProposal;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal || !proposal['votingInterfaceLink']) return;
    return m('.ProposalHeaderVotingInterfaceLink', [
      externalLink('a.voting-link', proposal['votingInterfaceLink'], [
        proposal['votingInterfaceLinkLabel'] ||
          extractDomain(proposal['votingInterfaceLink']),
        m(CWIcon, { iconName: 'externalLink' }),
      ]),
    ]);
  },
};

export const ProposalHeaderThreadLink: m.Component<{ proposal: AnyProposal }> =
  {
    view: (vnode) => {
      const { proposal } = vnode.attrs;
      if (!proposal || !proposal.threadId) return;
      const path = getProposalUrlPath(
        ProposalType.OffchainThread,
        `${proposal.threadId}`,
        false,
        proposal['chain']
      );
      return m('.ProposalHeaderThreadLink', [
        link('a.thread-link', path, [
          'Go to discussion',
          m(CWIcon, { iconName: 'externalLink' }),
        ]),
      ]);
    },
  };

export const ProposalHeaderSnapshotThreadLink: m.Component<{
  thread: { id: string; title: string };
}> = {
  view: (vnode) => {
    const { id, title } = vnode.attrs.thread;
    if (!id) return;
    const proposalLink = getProposalUrlPath(ProposalType.OffchainThread, id);

    return m('.ProposalHeaderThreadLink', [
      link('a.thread-link', proposalLink, [
        decodeURIComponent(title),
        m(CWIcon, { iconName: 'externalLink' }),
      ]),
    ]);
  },
};
