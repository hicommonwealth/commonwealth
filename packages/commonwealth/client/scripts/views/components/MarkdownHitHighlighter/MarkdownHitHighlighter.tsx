import DOMPurify from 'dompurify';
import { findAll } from 'highlight-words-core';
import React, { memo } from 'react';
import removeMd from 'remove-markdown';
import smartTruncate from 'smart-truncate';

type MarkdownStr = string;

type MarkdownHitHighlighterProps = Readonly<{
  markdown: MarkdownStr;
  searchTerm: string;
}>;

export const MarkdownHitHighlighter = memo(function MarkdownHitHighlighter(
  props: MarkdownHitHighlighterProps,
) {
  const { markdown, searchTerm } = props;

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

  // convert chunks to rendered components
  return chunks.map(({ end, highlight, start }, index) => {
    const middle = 15;

    const subString = docText.substr(start, end - start);

    const hasSingleChunk = chunks.length <= 1;
    const truncateLength = hasSingleChunk ? 150 : 40 + searchTerm.trim().length;
    const truncateOptions = hasSingleChunk
      ? {}
      : index === 0
        ? { position: 0 }
        : index === chunks.length - 1
          ? {}
          : { position: middle };

    let text = smartTruncate(subString, truncateLength, truncateOptions);

    // restore leading and trailing space
    if (subString.startsWith(' ')) {
      text = ` ${text}`;
    }
    if (subString.endsWith(' ')) {
      text = `${text} `;
    }

    const key = `chunk-${index}`;
    if (highlight) {
      return <mark key={key}>{text}</mark>;
    }
    return <span key={key}>{text}</span>;
  });
});
