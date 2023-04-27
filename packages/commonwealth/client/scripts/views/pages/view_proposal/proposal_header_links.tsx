import React from 'react';

import 'pages/view_proposal/proposal_header_links.scss';

import { ProposalType } from 'common-common/src/types';
import { externalLink, extractDomain, link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import type { AnyProposal } from 'models';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { useCommonNavigate } from 'navigation/helpers';

type ProposalHeaderLinkProps = {
  proposal: AnyProposal;
};

// "View in Subscan"
export const BlockExplorerLink = (props: ProposalHeaderLinkProps) => {
  const { proposal } = props;

  const navigate = useCommonNavigate();

  return (
    <div className="HeaderLink">
      {externalLink(
        'a',
        proposal['blockExplorerLink'],
        [
          proposal['blockExplorerLinkLabel'] ||
            extractDomain(proposal['blockExplorerLink']),
        ],
        navigate
      )}
      <CWIcon iconName="externalLink" iconSize="small" />
    </div>
  );
};

// "Vote on polkadot-js"
export const VotingInterfaceLink = (props: ProposalHeaderLinkProps) => {
  const { proposal } = props;

  const navigate = useCommonNavigate();

  return (
    <div className="HeaderLink">
      {externalLink(
        'a',
        proposal['votingInterfaceLink'],
        [
          proposal['votingInterfaceLinkLabel'] ||
            extractDomain(proposal['votingInterfaceLink']),
        ],
        navigate
      )}
      <CWIcon iconName="externalLink" iconSize="small" />
    </div>
  );
};

// "Go to discussion"
export const ThreadLink = (props: ProposalHeaderLinkProps) => {
  const { proposal } = props;

  const navigate = useCommonNavigate();

  const path = getProposalUrlPath(
    ProposalType.Thread,
    `${proposal.threadId}`,
    false,
    proposal['chain']
  );

  return (
    <div className="HeaderLink">
      {link('a', path, ['Go to discussion'], navigate)}
      <CWIcon iconName="externalLink" iconSize="small" />
    </div>
  );
};

type SnapshotThreadLinkProps = {
  thread: { id: string; title: string };
};

export const SnapshotThreadLink = (props: SnapshotThreadLinkProps) => {
  const { id, title } = props.thread;

  const navigate = useCommonNavigate();

  const proposalLink = getProposalUrlPath(ProposalType.Thread, id, true);

  return (
    <div className="HeaderLink">
      {link('a', proposalLink, [decodeURIComponent(title)], navigate)}
      <CWIcon iconName="externalLink" iconSize="small" />
    </div>
  );
};
