import React from 'react';
import { MarkdownViewerUsingQuillOrNewEditor } from './MarkdownViewerUsingQuillOrNewEditor/MarkdownViewerUsingQuillOrNewEditor';

type CollapsibleProposalBodyProps = {
  doc: string;
};

export const CollapsibleProposalBody = ({
  doc,
}: CollapsibleProposalBodyProps) => {
  return (
    <MarkdownViewerUsingQuillOrNewEditor markdown={doc} cutoffLines={50} />
  );
};
