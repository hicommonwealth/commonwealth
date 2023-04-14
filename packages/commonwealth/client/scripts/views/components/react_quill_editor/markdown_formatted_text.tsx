import DOMPurify from 'dompurify';
import removeMarkdown from 'markdown-to-text';
import { marked } from 'marked';
import React, { useMemo, useState } from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getClasses } from '../component_kit/helpers';
import { renderTruncatedHighlights } from './highlighter';
import type { QuillRendererProps } from './quill_renderer';
import { countLinesMarkdown } from './utils';

const OPEN_LINKS_IN_NEW_TAB = true;

const markdownRenderer = new marked.Renderer();
markdownRenderer.link = (href, title, text) => {
  return `<a ${
    href.indexOf('://commonwealth.im/') !== -1 && 'target="_blank"'
  } ${
    OPEN_LINKS_IN_NEW_TAB ? 'target="_blank"' : ''
  } href="${href}">${text}</a>`;
};
marked.setOptions({
  renderer: markdownRenderer,
  gfm: true, // use github flavored markdown
  smartypants: true,
  smartLists: true,
  xhtml: true,
});

type MarkdownFormattedTextProps = Omit<QuillRendererProps, 'doc'> & {
  doc: string;
};

export const MarkdownFormattedText = ({
  doc,
  hideFormatting,
  searchTerm,
  cutoffLines,
}: MarkdownFormattedTextProps) => {
  const [userExpand, setUserExpand] = useState<boolean>(false);

  const isTruncated: boolean = useMemo(() => {
    if (userExpand) {
      return false;
    }
    return cutoffLines && cutoffLines < countLinesMarkdown(doc);
  }, [userExpand, cutoffLines, doc]);

  const truncatedDoc = useMemo(() => {
    if (isTruncated) {
      const numChars = doc.split('\n', cutoffLines).join('\n').length;
      return doc.slice(0, numChars);
    }
    return doc;
  }, [cutoffLines, doc, isTruncated]);

  const unsanitizedHTML = marked.parse(truncatedDoc);

  const sanitizedHTML: string = useMemo(() => {
    return hideFormatting || searchTerm
      ? DOMPurify.sanitize(unsanitizedHTML, {
          ALLOWED_TAGS: ['a'],
          ADD_ATTR: ['target'],
        })
      : DOMPurify.sanitize(unsanitizedHTML, {
          USE_PROFILES: { html: true },
          ADD_ATTR: ['target'],
        });
  }, [hideFormatting, searchTerm, unsanitizedHTML]);

  // finalDoc is the rendered content which may include search term highlights
  const finalDoc = useMemo(() => {
    // if no search term, just render the doc normally
    if (!searchTerm) {
      return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }}></div>;
    }

    // get text from doc and replace new lines with spaces
    const docText = removeMarkdown(doc).replace(/\n/g, ' ').replace(/\+/g, ' ');

    const textWithHighlights = renderTruncatedHighlights(searchTerm, docText);

    // wrap all elements in span to avoid container-based positioning
    return <span>{textWithHighlights}</span>;
  }, [doc, sanitizedHTML, searchTerm]);

  const toggleDisplay = () => setUserExpand(!userExpand);

  return (
    <>
      <div
        className={getClasses<{ collapsed?: boolean }>(
          { collapsed: isTruncated },
          'MarkdownFormattedText'
        )}
      >
        {finalDoc}
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
