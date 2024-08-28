import { findAll } from 'highlight-words-core';
import React from 'react';
import smartTruncate from 'smart-truncate';

export const renderTruncatedHighlights = (
  searchTerm: string,
  docText: string,
) => {
  // extract highlighted text
  const chunks = findAll({
    searchWords: [searchTerm.trim()],
    textToHighlight: docText,
  });

  // convert chunks to rendered components
  const textWithHighlights = chunks.map(({ end, highlight, start }, index) => {
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

  return textWithHighlights;
};
