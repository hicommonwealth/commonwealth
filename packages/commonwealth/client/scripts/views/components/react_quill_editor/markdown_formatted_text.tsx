import React, { useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getClasses } from '../component_kit/helpers';
import { countLinesMarkdown } from './utils';

const OPEN_LINKS_IN_NEW_TAB = true;

const markdownRenderer = new marked.Renderer();
markdownRenderer.link = (href, title, text) => {
  return `<a ${href.indexOf('://commonwealth.im/') !== -1 && 'target="_blank"'} ${
    OPEN_LINKS_IN_NEW_TAB ? 'target="_blank"' : ''
  } href="${href}">${text}</a>`;
};
marked.setOptions({
  renderer: markdownRenderer,
  gfm: true, // use github flavored markdown
  smartypants: true,
  smartLists: true,
  xhtml: true
});

type MarkdownFormattedTextProps = {
  collapse?: boolean;
  doc: string;
  hideFormatting?: boolean;
  openLinksInNewTab?: boolean;
  searchTerm?: string;
  cutoffLines?: number;
};

export const MarkdownFormattedText = ({
  collapse,
  doc,
  hideFormatting,
  searchTerm,
  cutoffLines
}: MarkdownFormattedTextProps) => {
  const isTruncated = cutoffLines > 0 && cutoffLines < countLinesMarkdown(doc);

  const truncatedDoc = useMemo(() => {
    if (isTruncated) {
      return doc.slice(0, doc.split('\n', cutoffLines).join('\n').length);
    }
    return doc;
  }, [cutoffLines, doc, isTruncated]);

  const unsanitizedHTML = marked.parse(truncatedDoc.toString());

  const sanitizedHTML: string = useMemo(() => {
    return hideFormatting
      ? DOMPurify.sanitize(unsanitizedHTML, {
          ALLOWED_TAGS: ['a'],
          ADD_ATTR: ['target']
        })
      : DOMPurify.sanitize(unsanitizedHTML, {
          USE_PROFILES: { html: true },
          ADD_ATTR: ['target']
        });
  }, [hideFormatting, unsanitizedHTML]);

  const toggleDisplay = () => {
    console.log('toggleDisplay');
  };

  return (
    <>
      <div className={getClasses<{ collapsed?: boolean }>({ collapsed: !!collapse }, 'MarkdownFormattedText')}>
        <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }}></div>
      </div>
      {isTruncated && (
        <div className="show-more-button-wrapper">
          <div className="show-more-button" onClick={toggleDisplay}>
            <CWIcon iconName="plus" iconSize="small" />
            <div className="show-more-text">Show More</div>
          </div>
        </div>
      )}
    </>
  );
};
