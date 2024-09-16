import { useFlag } from 'hooks/useFlag';
import React, { ReactNode } from 'react';
import MarkdownViewer from 'views/components/MarkdownViewer';
import { QuillRenderer } from 'views/components/react_quill_editor/quill_renderer';

type MarkdownViewerUsingQuillOrNewEditor = {
  readonly markdown: string | undefined;
  readonly cutoffLines?: number;
  readonly customShowMoreButton?: ReactNode;
};

/**
 * Temporary migration component that uses a feature toggle for viewing content.
 */
export const MarkdownViewerUsingQuillOrNewEditor = (
  props: MarkdownViewerUsingQuillOrNewEditor,
) => {
  const { markdown, cutoffLines, customShowMoreButton } = props;

  const newEditor = useFlag('newEditor');

  if (newEditor) {
    return (
      <MarkdownViewer
        markdown={markdown}
        cutoffLines={cutoffLines}
        customShowMoreButton={customShowMoreButton}
      />
    );
  }

  return (
    <QuillRenderer
      doc={markdown ?? ''}
      cutoffLines={cutoffLines}
      customShowMoreButton={customShowMoreButton}
    />
  );
};
