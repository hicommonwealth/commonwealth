/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/proposal_header_links.scss';

import { externalLink, extractDomain, link } from 'helpers';
import { Thread, AnyProposal } from 'models';
import { getProposalUrlPath } from 'identifiers';
import { ProposalType } from 'common-common/src/types';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

// if you add a link when you create the thread
export class ProposalHeaderExternalLink
  implements
    m.ClassComponent<{
      proposal: AnyProposal | Thread;
    }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <div class="ProposalHeaderLink">
        {externalLink('a', proposal.url, [extractDomain(proposal.url)])}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}

// "View in Subscan"
export class ProposalHeaderBlockExplorerLink
  implements
    m.ClassComponent<{
      proposal: AnyProposal;
    }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <div class="ProposalHeaderLink">
        {externalLink('a', proposal['blockExplorerLink'], [
          proposal['blockExplorerLinkLabel'] ||
            extractDomain(proposal['blockExplorerLink']),
        ])}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}

// "Vote on polkadot-js"
export class ProposalHeaderVotingInterfaceLink
  implements
    m.ClassComponent<{
      proposal: AnyProposal;
    }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <div class="ProposalHeaderLink">
        {externalLink('a', proposal['votingInterfaceLink'], [
          proposal['votingInterfaceLinkLabel'] ||
            extractDomain(proposal['votingInterfaceLink']),
        ])}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}

// "Go to discussion"
export class ProposalHeaderThreadLink
  implements m.ClassComponent<{ proposal: AnyProposal }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    const path = getProposalUrlPath(
      ProposalType.Thread,
      `${proposal.threadId}`,
      false,
      proposal['chain']
    );

    return (
      <div class="ProposalHeaderLink">
        {link('a', path, ['Go to discussion'])}
        <CWIcon iconName="externalLink" iconSize="small" />
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

    const proposalLink = getProposalUrlPath(ProposalType.Thread, id);

    return (
      <div class="ProposalHeaderLink">
        {link('a', proposalLink, [decodeURIComponent(title)])}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}
