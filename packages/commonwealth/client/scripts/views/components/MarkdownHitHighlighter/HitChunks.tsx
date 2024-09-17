import React from 'react';
import smartTruncate from 'smart-truncate';

type Chunk = Readonly<{
  start: number;
  end: number;
  highlight: string;
}>;

type HitChunksProps = Readonly<{
  searchTerm: string;
  docText: string;
  chunks: ReadonlyArray<Chunk>;
}>;

export const HitChunks = (props: HitChunksProps) => {
  const { searchTerm, chunks, docText } = props;

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
};
