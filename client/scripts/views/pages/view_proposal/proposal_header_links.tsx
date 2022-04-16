/* eslint-disable max-classes-per-file */
/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/proposal_header_links.scss';

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
      <div class="ProposalHeaderLink">
        {externalLink('a', proposal.url, [
          extractDomain(proposal.url),
          <CWIcon iconName="externalLink" />,
        ])}
      </div>
    );
  }
}

export class ProposalHeaderBlockExplorerLink
  implements
    m.ClassComponent<{
      proposal: AnyProposal;
    }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;
    if (!proposal || !proposal['blockExplorerLink']) return;

    return (
      <div class="ProposalHeaderLink">
        {externalLink('a', proposal['blockExplorerLink'], [
          proposal['blockExplorerLinkLabel'] ||
            extractDomain(proposal['blockExplorerLink']),
          <CWIcon iconName="externalLink" />,
        ])}
      </div>
    );
  }
}

export class ProposalHeaderExternalSnapshotLink
  implements
    m.ClassComponent<{
      proposal: SnapshotProposal;
      spaceId: string;
    }>
{
  view(vnode) {
    const { proposal, spaceId } = vnode.attrs;
    if (!proposal || !proposal.id || !spaceId) return;

    return (
      <div class="ProposalHeaderLink">
        {externalLink(
          'a',
          `https://snapshot.org/#/${spaceId}/proposal/${proposal.id}`,
          [`View on Snapshot`, <CWIcon iconName="externalLink" />]
        )}
      </div>
    );
  }
}

export class ProposalHeaderVotingInterfaceLink
  implements
    m.ClassComponent<{
      proposal: AnyProposal;
    }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;
    if (!proposal || !proposal['votingInterfaceLink']) return;

    return (
      <div class="ProposalHeaderLink">
        {externalLink('a', proposal['votingInterfaceLink'], [
          proposal['votingInterfaceLinkLabel'] ||
            extractDomain(proposal['votingInterfaceLink']),
          <CWIcon iconName="externalLink" />,
        ])}
      </div>
    );
  }
}

export class ProposalHeaderThreadLink
  implements m.ClassComponent<{ proposal: AnyProposal }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;
    if (!proposal || !proposal.threadId) return;

    const path = getProposalUrlPath(
      ProposalType.OffchainThread,
      `${proposal.threadId}`,
      false,
      proposal['chain']
    );

    return (
      <div class="ProposalHeaderLink">
        {link('a', path, [
          'Go to discussion',
          <CWIcon iconName="externalLink" />,
        ])}
      </div>
    );
  }
}

export class ProposalHeaderSnapshotThreadLink
  implements
    m.ClassComponent<{
      thread: { id: string; title: string };
    }>
{
  view(vnode) {
    const { id, title } = vnode.attrs.thread;
    if (!id) return;
    const proposalLink = getProposalUrlPath(ProposalType.OffchainThread, id);

    return (
      <div class="ProposalHeaderLink">
        {link('a', proposalLink, [
          decodeURIComponent(title),
          <CWIcon iconName="externalLink" />,
        ])}
      </div>
    );
  }
}
