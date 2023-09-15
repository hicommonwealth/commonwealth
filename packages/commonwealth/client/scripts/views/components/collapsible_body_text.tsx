import React from 'react';

import { QuillRenderer } from './react_quill_editor/quill_renderer';

type CollapsibleProposalBodyProps = {
  doc: string;
};

export const CollapsibleProposalBody = ({
  doc,
}: CollapsibleProposalBodyProps) => {
  return <QuillRenderer doc={doc} cutoffLines={50} />;
};
