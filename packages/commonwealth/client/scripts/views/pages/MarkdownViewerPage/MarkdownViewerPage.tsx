import React from 'react';
import { useSearchParams } from 'react-router-dom';
import MarkdownViewer from 'views/components/MarkdownViewer';
import { QuillRenderer } from 'views/components/react_quill_editor/quill_renderer';
import '../../../../styles/index.scss';
import './MarkdownViewerPage.scss';

import supported from 'views/components/MarkdownEditor/markdown/supported.md?raw';

function useParams() {
  const [searchParams] = useSearchParams();
  const cutoffLines = searchParams.get('cutoffLines');
  const quill = searchParams.get('quill') === 'true';

  return {
    cutoffLines: cutoffLines ? parseInt(cutoffLines) : undefined,
    quill,
  };
}
/**
 * Basic demo page that allows us to use either mode and to log the markdown.
 */
export const MarkdownViewerPage = () => {
  const { cutoffLines, quill } = useParams();

  return (
    <section className="MarkdownViewerPage">
      {!quill && (
        <div className="inner">
          <MarkdownViewer markdown={supported} cutoffLines={cutoffLines} />
        </div>
      )}

      {quill && (
        <div className="inner">
          <QuillRenderer doc={supported} cutoffLines={cutoffLines} />
        </div>
      )}
    </section>
  );
};
