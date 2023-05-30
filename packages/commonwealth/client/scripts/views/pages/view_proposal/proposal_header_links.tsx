import React from 'react';
import { Link } from 'react-router-dom';

import 'pages/view_proposal/proposal_header_links.scss';

import { ProposalType } from 'common-common/src/types';
import { getProposalUrlPath } from 'identifiers';
import type { AnyProposal } from '../../../models/types';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

type ProposalHeaderLinkProps = {
  proposal: AnyProposal;
};

// "Go to discussion"
export const ThreadLink = ({ proposal }: ProposalHeaderLinkProps) => {
  const path = getProposalUrlPath(
    ProposalType.Thread,
    `${proposal.threadId}`,
    false,
    proposal['chain']
  );

  return (
    <div className="HeaderLink">
      <Link to={path}>Go to discussion</Link>
      <CWIcon iconName="externalLink" iconSize="small" />
    </div>
  );
};

type SnapshotThreadLinkProps = {
  thread: { id: string; title: string };
};

export const SnapshotThreadLink = ({ thread }: SnapshotThreadLinkProps) => {
  const proposalLink = getProposalUrlPath(ProposalType.Thread, thread.id, true);

  return (
    <div className="HeaderLink">
      <Link to={proposalLink}>{decodeURIComponent(thread.title)}</Link>
      <CWIcon iconName="externalLink" iconSize="small" />
    </div>
  );
};
