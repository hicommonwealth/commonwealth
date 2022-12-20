/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute } from 'mithrilInterop';

import 'pages/view_proposal/proposal_header_links.scss';

import { externalLink, extractDomain, link } from 'helpers';
import { AnyProposal } from 'models';
import { getProposalUrlPath } from 'identifiers';
import { ProposalType } from 'common-common/src/types';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

type ProposalHeaderLinkAttrs = {
  proposal: AnyProposal;
};

// "View in Subscan"
export class BlockExplorerLink extends ClassComponent<ProposalHeaderLinkAttrs> {
  view(vnode: ResultNode<ProposalHeaderLinkAttrs>) {
    const { proposal } = vnode.attrs;

    return (
      <div class="HeaderLink">
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
export class VotingInterfaceLink extends ClassComponent<ProposalHeaderLinkAttrs> {
  view(vnode: ResultNode<ProposalHeaderLinkAttrs>) {
    const { proposal } = vnode.attrs;

    return (
      <div class="HeaderLink">
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
export class ThreadLink extends ClassComponent<ProposalHeaderLinkAttrs> {
  view(vnode: ResultNode<ProposalHeaderLinkAttrs>) {
    const { proposal } = vnode.attrs;

    const path = getProposalUrlPath(
      ProposalType.Thread,
      `${proposal.threadId}`,
      false,
      proposal['chain']
    );

    return (
      <div class="HeaderLink">
        {link('a', path, ['Go to discussion'])}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}

type SnapshotThreadLinkAttrs = {
  thread: { id: string; title: string };
};

export class SnapshotThreadLink extends ClassComponent<SnapshotThreadLinkAttrs> {
  view(vnode: ResultNode<SnapshotThreadLinkAttrs>) {
    const { id, title } = vnode.attrs.thread;

    const proposalLink = getProposalUrlPath(ProposalType.Thread, id);

    return (
      <div class="HeaderLink">
        {link('a', proposalLink, [decodeURIComponent(title)])}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}
