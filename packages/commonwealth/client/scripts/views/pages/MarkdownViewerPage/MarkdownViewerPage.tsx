import React from 'react';

import supported from 'views/components/MarkdownEditor/markdown/supported.md?raw';
import MarkdownViewer from 'views/components/MarkdownViewer';

import { useSearchParams } from 'react-router-dom';
import '../../../../styles/index.scss';
import './MarkdownViewerPage.scss';

function useParams() {
  const [searchParams] = useSearchParams();
  const cutoffLines = searchParams.get('cutoffLines');
  return {
    cutoffLines: cutoffLines ? parseInt(cutoffLines) : undefined,
  };
}
/**
 * Basic demo page that allows us to use either mode and to log the markdown.
 */
export const MarkdownViewerPage = () => {
  const { cutoffLines } = useParams();

  return (
    <section className="MarkdownViewerPage">
      <div className="inner">
        <MarkdownViewer markdown={supported} cutoffLines={cutoffLines} />
      </div>
    </section>
  );
};
