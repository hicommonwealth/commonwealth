import React, { useState, useMemo } from 'react';

import 'components/quill/quill_formatted_text.scss';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getClasses } from '../component_kit/helpers';

import { renderQuillDelta } from './render_quill_delta';
import { useCommonNavigate } from 'navigation/helpers';
import { DeltaStatic } from 'quill';
import { renderTruncatedHighlights } from './highlighter';
import { QuillRendererProps } from './quill_renderer';
import {
  countCharactersQuill,
  countLinesQuill,
  getTextFromDelta,
} from './utils';

type QuillFormattedTextProps = Omit<QuillRendererProps, 'doc'> & {
  doc: DeltaStatic;
};

enum CutoffType {
  None,
  Lines,
  Characters,
}

// NOTE: Do NOT use this directly. Use QuillRenderer instead.
export const QuillFormattedText = ({
  doc,
  hideFormatting,
  cutoffLines,
  cutoffCharacters,
  openLinksInNewTab,
  searchTerm,
}: QuillFormattedTextProps) => {
  const navigate = useCommonNavigate();

  const [userExpand, setUserExpand] = useState<boolean>(false);

  const truncateType: CutoffType = useMemo(() => {
    if (userExpand) {
      return CutoffType.None;
    }
    if (cutoffLines && cutoffLines < countLinesQuill(doc)) {
      return CutoffType.Lines;
    }
    if (cutoffCharacters && cutoffCharacters < countCharactersQuill(doc)) {
      return CutoffType.Characters;
    }

    return CutoffType.None;
  }, [cutoffCharacters, cutoffLines, doc, userExpand]);

  const truncatedDoc: DeltaStatic = useMemo(() => {
    // make deep copy to leave original untouched.
    let ops = JSON.parse(JSON.stringify(doc.ops));
    if (truncateType === CutoffType.Lines) {
      return {
        ops: [...doc.ops.slice(0, cutoffLines)],
      } as DeltaStatic;
    }
    if (truncateType === CutoffType.Characters) {
      let totalChars = 0;
      let i = 0;

      // find which insert goes past cutoff, cut remaining from this insert
      while (totalChars < cutoffCharacters) {
        totalChars += ops[i++].insert.length;
      }

      // remove strings that go over cutoff
      ops = [...ops.slice(0, i)];

      // If the last insert went over the cutoff, adjust the length of the last insert
      if (i > 0 && totalChars > cutoffCharacters) {
        const cutTo =
          ops.slice()[i - 1].insert.length - (totalChars - cutoffCharacters);
        ops[i - 1].insert = ops[i - 1].insert.slice(0, cutTo) + '...';
      }

      return {
        ops: ops,
      } as DeltaStatic;
    }
    return doc;
  }, [cutoffCharacters, cutoffLines, doc, truncateType]);

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

  const onClick = (e) => {
    e.stopPropagation();
    setUserExpand(!userExpand);
  };

  return (
    <>
      <div
        className={getClasses<{ collapsed?: boolean }>(
          { collapsed: truncateType !== CutoffType.None },
          'MarkdownFormattedText'
        )}
      >
        {finalDoc}
      </div>
      {truncateType !== CutoffType.None && (
        <div className="show-more-button-wrapper">
          <div className="show-more-button" onClick={onClick}>
            <CWIcon iconName="plus" iconSize="small" />
            <div className="show-more-text">Show More</div>
          </div>
        </div>
      )}
    </>
  );
};
