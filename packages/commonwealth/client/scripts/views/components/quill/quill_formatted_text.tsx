import React, { useState, useEffect, useCallback } from 'react';

import 'components/quill/quill_formatted_text.scss';
import { findAll } from 'highlight-words-core';
import smartTruncate from 'smart-truncate';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getClasses } from '../component_kit/helpers';
import { countLinesQuill } from './helpers';

// import { loadScript } from 'helpers';
import { renderQuillDelta } from './render_quill_delta';
import { useCommonNavigate } from 'navigation/helpers';
import { rootRender } from 'mithrilInterop';

export type QuillTextParams = {
  hideFormatting?: boolean;
  cutoffLines?: number;
  openLinksInNewTab?: boolean;
  searchTerm?: string;
};

type QuillFormattedTextAttrs = {
  doc;
} & QuillTextParams;

export const QuillFormattedText: React.FC<QuillFormattedTextAttrs> = ({
  doc,
  hideFormatting,
  cutoffLines,
  openLinksInNewTab,
  searchTerm,
}) => {
  const navigate = useCommonNavigate();
  const [cachedDocWithHighlights, setCachedDocWithHighlights] = useState();
  const [cachedResultWithHighlights, setCachedResultWithHighlights] =
    useState();
  const [isTruncated, setIsTruncated] = useState<boolean>();
  const [truncatedDoc, setTruncatedDoc] = useState();

  useEffect(() => {
    const isTruncated = cutoffLines && cutoffLines < countLinesQuill(doc.ops);
    const truncatedDoc = isTruncated
      ? {
          ops: [...doc.ops.slice(0, cutoffLines)],
        }
      : doc;
    setTruncatedDoc(truncatedDoc);
    setIsTruncated(isTruncated);
  }, [doc, cutoffLines]);

  const toggleDisplay = useCallback(() => {
    if (isTruncated) {
      setTruncatedDoc(doc); // set to full doc
    } else {
      setTruncatedDoc({ ops: [...doc.ops.slice(0, cutoffLines)] }); // set to truncated doc
    }
    setIsTruncated(!isTruncated);
  }, [isTruncated, cutoffLines, doc]);

  // if we're showing highlighted search terms, render the doc once, and cache the result
  if (searchTerm) {
    if (
      truncatedDoc &&
      JSON.stringify(truncatedDoc) !== cachedDocWithHighlights
    ) {
      const vnodes = truncatedDoc
        ? renderQuillDelta(truncatedDoc, hideFormatting, true, false, navigate)
        : []; // collapse = true, to inline blocks

      const root = document.createElement('div');

      rootRender(root, vnodes);

      const textToHighlight = root.innerText
        .replace(/\n/g, ' ')
        .replace(/\+/g, ' ');

      const chunks = findAll({
        searchWords: [searchTerm.trim()],
        textToHighlight,
      });

      setCachedDocWithHighlights(JSON.stringify(truncatedDoc));

      setCachedResultWithHighlights(
        chunks.map(({ end, highlight, start }, index) => {
          const middle = 15;

          const subString = textToHighlight.substr(start, end - start);

          let text = smartTruncate(
            subString,
            chunks.length <= 1 ? 150 : 40 + searchTerm.trim().length,
            chunks.length <= 1
              ? {}
              : index === 0
              ? { position: 0 }
              : index === chunks.length - 1
              ? {}
              : { position: middle }
          );

          if (subString[subString.length - 1] === ' ') {
            text += ' ';
          }

          if (subString[0] === ' ') {
            text = ` ${text}`;
          }

          return highlight ? <mark>{text}</mark> : <span>{text}</span>;
        })
      );
    }

    return (
      <div
        className={getClasses<{ collapsed?: boolean }>(
          { collapsed: isTruncated },
          'QuillFormattedText'
        )}
      >
        {cachedResultWithHighlights}
      </div>
    );
  } else {
    return (
      <div
        className="QuillFormattedText"
        // oncreate={() => {
        // if (!(<any>window).twttr) {
        //   loadScript('//platform.twitter.com/widgets.js').then(() => {
        //     console.log('Twitter Widgets loaded');
        //   })
        // }}
      >
        {truncatedDoc &&
          renderQuillDelta(
            truncatedDoc,
            hideFormatting,
            false,
            openLinksInNewTab,
            navigate
          )}
        {isTruncated && (
          <div className="show-more-button-wrapper">
            <div className="show-more-button" onClick={toggleDisplay}>
              <CWIcon iconName="plus" iconSize="small" />
              <div className="show-more-text">Show More</div>
            </div>
          </div>
        )}
      </div>
    );
  }
};
