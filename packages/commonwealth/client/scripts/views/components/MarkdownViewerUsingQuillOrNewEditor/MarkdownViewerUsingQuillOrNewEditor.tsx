import { useFlag } from 'hooks/useFlag';
import React from 'react';
import MarkdownViewer from 'views/components/MarkdownViewer';
import { QuillRenderer } from 'views/components/react_quill_editor/quill_renderer';

type MarkdownViewerUsingQuillOrNewEditor = {
  readonly markdown: string | undefined;
  readonly cutoffLines?: number;
};

/**
 * Temporary migration component that uses a feature toggle for viewing content.
 */
export const MarkdownViewerUsingQuillOrNewEditor = (
  props: MarkdownViewerUsingQuillOrNewEditor,
) => {
  const { markdown, cutoffLines } = props;

  const newEditor = useFlag('newEditor');

  if (newEditor) {
    return <MarkdownViewer markdown={markdown} cutoffLines={cutoffLines} />;
  }

  return <QuillRenderer doc={markdown ?? ''} cutoffLines={cutoffLines} />;
};
