import DOMPurify from 'dompurify';
import { findAll } from 'highlight-words-core';
import React, { memo } from 'react';
import removeMd from 'remove-markdown';
import { HitChunks } from 'views/components/MarkdownHitHighlighter/HitChunks';

type MarkdownStr = string;

type MarkdownHitHighlighterProps = Readonly<{
  className?: string;
  markdown: MarkdownStr;
  searchTerm: string;
}>;

export const MarkdownHitHighlighter = memo(function MarkdownHitHighlighter(
  props: MarkdownHitHighlighterProps,
) {
  const { markdown, searchTerm, className } = props;

  const html = DOMPurify.sanitize(markdown, {
    ALLOWED_TAGS: ['a'],
    ADD_ATTR: ['target'],
  });

  const docText = removeMd(html).replace(/\n/g, ' ').replace(/\+/g, ' ');

  // extract highlighted text
  const chunks = findAll({
    searchWords: [searchTerm.trim()],
    textToHighlight: docText,
  });

  return (
    <div className={className}>
      <HitChunks chunks={chunks} docText={docText} searchTerm={searchTerm} />
    </div>
  );
});
