import React from 'react';

import type { AnyProposal } from 'models';

import { QuillRenderer } from './react_quill_editor/quill_renderer';

type CollapsibleProposalBodyProps = {
  proposal: AnyProposal;
};

export const CollapsibleProposalBody = ({ proposal }: CollapsibleProposalBodyProps) => {
  console.log({ proposal });
  return <QuillRenderer doc={proposal.description} cutoffLines={50} />;
};
