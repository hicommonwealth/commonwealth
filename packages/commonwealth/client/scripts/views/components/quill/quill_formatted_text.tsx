import React, { useState, useMemo } from 'react';

import 'components/quill/quill_formatted_text.scss';
import { findAll } from 'highlight-words-core';
import smartTruncate from 'smart-truncate';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getClasses } from '../component_kit/helpers';
import { countLinesQuill } from './helpers';

import { renderQuillDelta } from './render_quill_delta';
import { useCommonNavigate } from 'navigation/helpers';
import { DeltaStatic } from 'quill';
import { getTextFromDelta } from '../react_quill_editor';

export type QuillTextParams = {
  hideFormatting?: boolean;
  cutoffLines?: number;
  openLinksInNewTab?: boolean;
  searchTerm?: string;
};

type QuillFormattedTextProps = {
  doc;
} & QuillTextParams;

export const QuillFormattedText = ({
  doc,
  hideFormatting,
  cutoffLines,
  openLinksInNewTab,
  searchTerm
}: QuillFormattedTextProps) => {
  const navigate = useCommonNavigate();

  const [userTruncated, setUserTruncated] = useState<boolean>(false);

  const isTruncated: boolean = useMemo(() => {
    return userTruncated || (cutoffLines && cutoffLines < countLinesQuill(doc.ops));
  }, [userTruncated, cutoffLines, doc.ops]);

  const truncatedDoc: DeltaStatic = useMemo(() => {
    return isTruncated
      ? {
          ops: [...doc.ops.slice(0, cutoffLines)]
        }
      : doc;
  }, [cutoffLines, doc, isTruncated]);

  const toggleDisplay = () => setUserTruncated(!userTruncated);

  // finalDoc is the quill content which may include search term highlights
  const finalDoc = useMemo(() => {
    // if no search term, just render the doc normally
    if (!searchTerm) {
      return renderQuillDelta(truncatedDoc, hideFormatting, false, openLinksInNewTab, navigate);
    }

    // get text from doc and replace new lines with spaces
    const docText = getTextFromDelta(truncatedDoc).replace(/\n/g, ' ').replace(/\+/g, ' ');

    // extract highlighted text
    const chunks = findAll({
      searchWords: [searchTerm.trim()],
      textToHighlight: docText
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

    // wrap all elements in span to avoid container-based positioning
    return <span>{textWithHighlights}</span>;
  }, [hideFormatting, navigate, openLinksInNewTab, searchTerm, truncatedDoc]);

  // if we're showing highlighted search terms, render the doc once, and cache the result
  if (searchTerm) {
    return (
      <div className={getClasses<{ collapsed?: boolean }>({ collapsed: isTruncated }, 'QuillFormattedText')}>
        {finalDoc}
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
        {truncatedDoc && finalDoc}
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
