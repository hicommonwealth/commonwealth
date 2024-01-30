import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import 'components/react_quill/markdown_formatted_text.scss';

import DOMPurify from 'dompurify';
import { loadScript } from 'helpers';
import { twitterLinkRegex } from 'helpers/constants';
import { debounce } from 'lodash';
import { marked } from 'marked';
import removeMd from 'remove-markdown';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getClasses } from '../component_kit/helpers';
import { renderTruncatedHighlights } from './highlighter';
import { QuillRendererProps } from './quill_renderer';
import {
  countLinesMarkdown,
  fetchTwitterEmbedInfo,
  isMarkdownTable,
  markdownToHtmlTable,
} from './utils';

const OPEN_LINKS_IN_NEW_TAB = true;

const markdownRenderer = new marked.Renderer();
markdownRenderer.link = (href, title, text) => {
  return `<a ${
    href.indexOf('://commonwealth.im/') !== -1 && 'target="_blank"'
  } ${
    OPEN_LINKS_IN_NEW_TAB ? 'target="_blank"' : ''
  } href="${href}">${text}</a>`;
};
markdownRenderer.image = (href, title, text) => {
  if (href?.startsWith('ipfs://')) {
    const hash = href.split('ipfs://')[1];
    if (hash) {
      href = `https://ipfs.io/ipfs/${hash}`;
    }
  }
  return `<img alt="${text}" src="${href}"/>`;
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

// NOTE: Do NOT use this directly. Use QuillRenderer instead.
export const MarkdownFormattedText = ({
  doc,
  hideFormatting,
  searchTerm,
  cutoffLines,
}: MarkdownFormattedTextProps) => {
  const containerRef = useRef<HTMLDivElement>();
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

    let docText = doc;
    try {
      docText = removeMd(doc).replace(/\n/g, ' ').replace(/\+/g, ' ');
    } catch (e) {
      docText = doc;
    }

    // get text from doc and replace new lines with spaces
    const textWithHighlights = renderTruncatedHighlights(searchTerm, docText);

    // wrap all elements in span to avoid container-based positioning
    return <span>{textWithHighlights}</span>;
  }, [doc, sanitizedHTML, searchTerm]);

  const toggleDisplay = () => setUserExpand(!userExpand);

  const convertTwitterLinks = useCallback(
    debounce(async () => {
      // walk through rendered markdown DOM elements
      const walker = document.createTreeWalker(
        containerRef.current,
        NodeFilter.SHOW_ELEMENT,
      );

      while (walker?.nextNode()) {
        if (walker.currentNode instanceof HTMLAnchorElement) {
          const href = walker.currentNode?.href;
          if (href.match(twitterLinkRegex)) {
            // fetch embed info
            const embedInfo = await fetchTwitterEmbedInfo(href);
            if (embedInfo.result.html) {
              // load widget script
              const w = window as any;
              const callback = () => {
                setTimeout(() => {
                  w.twttr?.widgets?.load();
                  // add embed
                  const embedEl = document.createElement('div');
                  embedEl.innerHTML = embedInfo.result.html;
                  walker?.currentNode?.parentElement?.insertBefore(
                    embedEl,
                    walker.currentNode,
                  );
                }, 1);
              };
              if (!w.twttr) {
                loadScript('//platform.twitter.com/widgets.js').then(callback);
              } else {
                callback();
              }
            }
          }
        }
      }
    }, 300),
    [],
  );

  // when doc is rendered, convert twitter links to embeds
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    convertTwitterLinks();
    return () => {
      convertTwitterLinks.cancel();
    };
  }, [finalDoc]);

  return (
    <>
      <div
        ref={containerRef}
        className={getClasses<{ collapsed?: boolean }>(
          { collapsed: isTruncated },
          'MarkdownFormattedText',
        )}
      >
        {isMarkdownTable(doc) ? (
          <div dangerouslySetInnerHTML={{ __html: markdownToHtmlTable(doc) }} />
        ) : (
          finalDoc
        )}
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
