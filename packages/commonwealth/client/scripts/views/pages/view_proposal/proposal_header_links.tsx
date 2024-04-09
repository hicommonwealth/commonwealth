/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Link } from 'react-router-dom';

import 'pages/view_proposal/proposal_header_links.scss';

import { ProposalType } from '@hicommonwealth/shared';
import { getProposalUrlPath } from 'identifiers';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

type ProposalHeaderLinkProps = {
  threads: { id: number; title: string }[];
  community: string;
};

// "Go to discussion"
const threadLinkButton = (
  threadId: number,
  title: string,
  community: string,
) => {
  const path = getProposalUrlPath(
    ProposalType.Thread,
    threadId,
    false,
    community,
  );

  return (
    <div className="HeaderLink">
      <Link to={path}>
        {title ? decodeURIComponent(title) : 'Go to thread'}
      </Link>
      <CWIcon iconName="externalLink" iconSize="small" />
    </div>
  );
};
export const ThreadLink = ({ threads, community }: ProposalHeaderLinkProps) => {
  const components: JSX.Element[] = [];
  threads.forEach((t) =>
    components.push(threadLinkButton(t.id, t.title, community)),
  );
  return <React.Fragment>{components}</React.Fragment>;
};

type SnapshotThreadLinkProps = {
  thread: { id: number; title: string };
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
