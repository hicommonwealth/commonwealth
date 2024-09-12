import React from 'react';

import supported from 'views/components/MarkdownEditor/markdown/supported.md?raw';
import MarkdownViewer from 'views/components/MarkdownViewer';

import "./MarkdownViewerPage.scss"
import "../../../../styles/index.scss"


/**
 * Basic demo page that allows us to use either mode and to log the markdown.
 */
export const MarkdownViewerPage = () => {
  return (
    <section className="MarkdownViewerPage">
      <div className="inner">
        <MarkdownViewer markdown={supported} />
      </div>
    </section>
  );
};
