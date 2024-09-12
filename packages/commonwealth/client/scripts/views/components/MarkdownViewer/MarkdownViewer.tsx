import React, { memo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type MarkdownStr = string;

export type MarkdownViewerProps = Readonly<{
  markdown: MarkdownStr;
}>;

export const MarkdownViewer = memo(function MarkdownViewer(
  props: MarkdownViewerProps,
) {
  const { markdown } = props;

  return <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>;
});
