import { useFlag } from 'hooks/useFlag';
import React from 'react';
import MarkdownHitHighlighter from 'views/components/MarkdownHitHighlighter';
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

  const newEditor = useFlag('newEditor');

  if (newEditor) {
    return (
      <MarkdownHitHighlighter
        markdown={markdown}
        searchTerm={searchTerm}
        className={className}
      />
    );
  }

  return (
    <QuillRenderer
      hideFormatting={true}
      doc={markdown}
      searchTerm={searchTerm}
      containerClass="SearchQuillRenderer"
    />
  );
};
