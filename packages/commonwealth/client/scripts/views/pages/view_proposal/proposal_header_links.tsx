import React, { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import 'pages/view_proposal/proposal_header_links.scss';

import { ProposalType } from 'common-common/src/types';
import { getProposalUrlPath } from 'identifiers';
import type { AnyProposal } from '../../../models/types';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

type ProposalHeaderLinkProps = {
  threads: any[];
  chain: string;
};

// "Go to discussion"
const threadLinkButton = (threadId: string, title: string, chain: string) => {
  const path = getProposalUrlPath(
    ProposalType.Thread,
    `${threadId}`,
    false,
    chain
  );

  return (
    <div className="HeaderLink">
      <Link to={path}>{title ? decodeURIComponent(title) : 'Go to thread'}</Link>
      <CWIcon iconName="externalLink" iconSize="small" />
    </div>
  );
};
export const ThreadLink = ({ threads, chain }: ProposalHeaderLinkProps) => {
  const components: JSX.Element[] = [];
  threads.forEach((t) =>
    components.push(threadLinkButton(t.id, t.title, chain))
  );
  return <React.Fragment>{components}</React.Fragment>;
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
