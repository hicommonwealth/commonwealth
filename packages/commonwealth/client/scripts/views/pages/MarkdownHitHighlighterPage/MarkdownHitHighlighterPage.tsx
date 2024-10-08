import React from 'react';
import { useSearchParams } from 'react-router-dom';
import supported from 'views/components/MarkdownEditor/markdown/supported.md?raw';
import MarkdownHitHighlighter from 'views/components/MarkdownHitHighlighter';

import './MarkdownHitHighlighterPage.scss';

function useParams() {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('searchTerm') ?? undefined;

  return {
    searchTerm,
  };
}
export const MarkdownHitHighlighterPage = () => {
  const { searchTerm } = useParams();

  return (
    <section className="MarkdownHitHighlighterPage">
      <div className="inner">
        <MarkdownHitHighlighter
          markdown={supported}
          searchTerm={searchTerm ?? 'war'}
        />
      </div>
    </section>
  );
};
