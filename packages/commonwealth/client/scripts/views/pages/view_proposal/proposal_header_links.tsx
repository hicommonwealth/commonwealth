import React from 'react';

import 'pages/view_proposal/proposal_header_links.scss';

import { ProposalType } from 'common-common/src/types';
import { link } from 'helpers';
import { getProposalUrlPath } from 'identifiers';
import type { AnyProposal } from '../../../models/types';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { useCommonNavigate } from 'navigation/helpers';

type ProposalHeaderLinkProps = {
  proposal: AnyProposal;
};

// "Go to discussion"
export const ThreadLink = ({ proposal }: ProposalHeaderLinkProps) => {
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

export const SnapshotThreadLink = ({ thread }: SnapshotThreadLinkProps) => {
  const navigate = useCommonNavigate();

  const proposalLink = getProposalUrlPath(ProposalType.Thread, thread.id, true);

  return (
    <div className="HeaderLink">
      {link('a', proposalLink, [decodeURIComponent(thread.title)], navigate)}
      <CWIcon iconName="externalLink" iconSize="small" />
    </div>
  );
};
