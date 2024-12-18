import React from 'react';
import { MarkdownViewerWithFallback } from 'views/components/MarkdownViewerWithFallback/MarkdownViewerWithFallback';

type CollapsibleProposalBodyProps = {
  doc: string;
};

export const CollapsibleProposalBody = ({
  doc,
}: CollapsibleProposalBodyProps) => {
  return <MarkdownViewerWithFallback markdown={doc} cutoffLines={50} />;
};
