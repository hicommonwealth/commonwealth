import { MIN_CHARS_TO_SHOW_MORE } from '@hicommonwealth/shared';
import React from 'react';
import { MarkdownViewerWithFallback } from 'views/components/MarkdownViewerWithFallback/MarkdownViewerWithFallback';

type CollapsibleProposalBodyProps = {
  doc: string;
};

export const CollapsibleProposalBody = ({
  doc,
}: CollapsibleProposalBodyProps) => {
  return (
    <MarkdownViewerWithFallback
      markdown={doc}
      maxChars={MIN_CHARS_TO_SHOW_MORE}
      cutoffLines={50}
    />
  );
};
