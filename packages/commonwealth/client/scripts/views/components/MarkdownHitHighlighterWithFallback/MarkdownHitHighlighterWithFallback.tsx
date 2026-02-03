import React from 'react';
import { QuillRenderer } from 'views/components/react_quill_editor/quill_renderer';

type MarkdownHitHighlighterWithFallbackProps = Readonly<{
  className?: string;
  markdown: string;
  searchTerm: string;
}>;

export const MarkdownHitHighlighterWithFallback = (
  props: MarkdownHitHighlighterWithFallbackProps,
) => {
  const { markdown, searchTerm, className } = props;

  return (
    <QuillRenderer
      hideFormatting={true}
      doc={markdown}
      searchTerm={searchTerm}
      containerClass={className ?? 'SearchQuillRenderer'}
    />
  );
};
