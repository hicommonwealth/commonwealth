import {
  chainEntityTypeToProposalName,
  chainEntityTypeToProposalSlug,
  getProposalUrlPath,
} from 'identifiers';
import type Thread from '../../../models/Thread';
import React from 'react';
import app from 'state';
import { Link as ReactRouterLink } from 'react-router-dom';

type LinkedProposalProps = {
  thread: Thread;
  title: string;
  identifier: string;
};

export const LinkedProposal = ({ thread, title, identifier }: LinkedProposalProps) => {
  const slug = chainEntityTypeToProposalSlug();

  const threadLink = `${
    app.isCustomDomain() ? '' : `/${thread.chain}`
  }${getProposalUrlPath(slug, identifier, true)}`;

  return (
    <ReactRouterLink to={threadLink}>
      {`${
        title ?? chainEntityTypeToProposalName() ?? 'Proposal'
      } #${identifier}`}
    </ReactRouterLink>
  );
};