import React from 'react';

import type { AnyProposal } from '../../models/types';

import { QuillRenderer } from './react_quill_editor/quill_renderer';

type CollapsibleProposalBodyProps = {
  proposal: AnyProposal;
};

export const CollapsibleProposalBody = ({
  proposal,
}: CollapsibleProposalBodyProps) => {
  return <QuillRenderer doc={proposal.description} cutoffLines={50} />;
};
