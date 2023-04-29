import React, { useState, useMemo } from 'react';

import 'components/quill/quill_formatted_text.scss';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getClasses } from '../component_kit/helpers';

import { renderQuillDelta } from './render_quill_delta';
import { useCommonNavigate } from 'navigation/helpers';
import { DeltaStatic } from 'quill';
import { renderTruncatedHighlights } from './highlighter';
import { QuillRendererProps } from './quill_renderer';
import { countLinesQuill, getTextFromDelta } from './utils';

type QuillFormattedTextProps = Omit<QuillRendererProps, 'doc'> & {
  doc: DeltaStatic;
};

// NOTE: Do NOT use this directly. Use QuillRenderer instead.
export const QuillFormattedText = ({
  doc,
  hideFormatting,
  cutoffLines,
  openLinksInNewTab,
  searchTerm,
}: QuillFormattedTextProps) => {
  const navigate = useCommonNavigate();

  const [userExpand, setUserExpand] = useState<boolean>(false);

  const isTruncated: boolean = useMemo(() => {
    if (userExpand) {
      return false;
    }
    return cutoffLines && cutoffLines < countLinesQuill(doc);
  }, [cutoffLines, doc, userExpand]);

  const truncatedDoc: DeltaStatic = useMemo(() => {
    if (isTruncated) {
      return {
        ops: [...doc.ops.slice(0, cutoffLines)],
      } as DeltaStatic;
    }
    return doc;
  }, [cutoffLines, doc, isTruncated]);

  // finalDoc is the rendered content which may include search term highlights
  const finalDoc = useMemo(() => {
    // if no search term, just render the doc normally
    if (!searchTerm) {
      return renderQuillDelta(
        truncatedDoc,
        hideFormatting,
        false,
        openLinksInNewTab,
        navigate
      );
    }

    // get text from doc and replace new lines with spaces
    const docText = getTextFromDelta(truncatedDoc)
      .replace(/\n/g, ' ')
      .replace(/\+/g, ' ');

    const textWithHighlights = renderTruncatedHighlights(searchTerm, docText);

    // wrap all elements in span to avoid container-based positioning
    return <span>{textWithHighlights}</span>;
  }, [hideFormatting, navigate, openLinksInNewTab, searchTerm, truncatedDoc]);

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
