import React from 'react';

import { MAX_CHARS_TO_SHOW_MORE } from '@hicommonwealth/shared';
import { QuillRenderer } from './react_quill_editor/quill_renderer';

type CollapsibleProposalBodyProps = {
  doc: string;
};

export const CollapsibleProposalBody = ({
  doc,
}: CollapsibleProposalBodyProps) => {
  return <QuillRenderer doc={doc} maxChars={MAX_CHARS_TO_SHOW_MORE} />;
};
