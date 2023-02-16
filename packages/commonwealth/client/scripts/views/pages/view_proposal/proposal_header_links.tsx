import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';
import { ProposalType } from 'common-common/src/types';

import { externalLink, extractDomain, link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import type { AnyProposal } from 'models';

import 'pages/view_proposal/proposal_header_links.scss';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import withRouter from 'navigation/helpers';

type ProposalHeaderLinkAttrs = {
  proposal: AnyProposal;
};

// "View in Subscan"
class BlockExplorerLinkComponent extends ClassComponent<ProposalHeaderLinkAttrs> {
  view(vnode: ResultNode<ProposalHeaderLinkAttrs>) {
    const { proposal } = vnode.attrs;

    return (
      <div className="HeaderLink">
        {externalLink(
          'a',
          proposal['blockExplorerLink'],
          [
            proposal['blockExplorerLinkLabel'] ||
              extractDomain(proposal['blockExplorerLink']),
          ],
          this.setRoute
        )}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}

export const BlockExplorerLink = withRouter(BlockExplorerLinkComponent);

// "Vote on polkadot-js"
class VotingInterfaceLinkComponent extends ClassComponent<ProposalHeaderLinkAttrs> {
  view(vnode: ResultNode<ProposalHeaderLinkAttrs>) {
    const { proposal } = vnode.attrs;

    return (
      <div className="HeaderLink">
        {externalLink(
          'a',
          proposal['votingInterfaceLink'],
          [
            proposal['votingInterfaceLinkLabel'] ||
              extractDomain(proposal['votingInterfaceLink']),
          ],
          this.setRoute
        )}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}

export const VotingInterfaceLink = withRouter(VotingInterfaceLinkComponent);

// "Go to discussion"
class ThreadLinkComponent extends ClassComponent<ProposalHeaderLinkAttrs> {
  view(vnode: ResultNode<ProposalHeaderLinkAttrs>) {
    const { proposal } = vnode.attrs;

    const path = getProposalUrlPath(
      ProposalType.Thread,
      `${proposal.threadId}`,
      false,
      proposal['chain']
    );

    return (
      <div className="HeaderLink">
        {link('a', path, ['Go to discussion'], this.setRoute.bind(this))}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}

export const ThreadLink = withRouter(ThreadLinkComponent);

type SnapshotThreadLinkAttrs = {
  thread: { id: string; title: string };
};

class SnapshotThreadLinkComponent extends ClassComponent<SnapshotThreadLinkAttrs> {
  view(vnode: ResultNode<SnapshotThreadLinkAttrs>) {
    const { id, title } = vnode.attrs.thread;

    const proposalLink = getProposalUrlPath(ProposalType.Thread, id, true);

    return (
      <div className="HeaderLink">
        {link(
          'a',
          proposalLink,
          [decodeURIComponent(title)],
          this.setRoute.bind(this)
        )}
        <CWIcon iconName="externalLink" iconSize="small" />
      </div>
    );
  }
}

export const SnapshotThreadLink = withRouter(SnapshotThreadLinkComponent);
