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
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';

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

    type TextWithHighlightsArray = Array<
      React.ReactElement<TextWithHighlightsProps>
    >;

    type LinkProps = {
      href: string;
    };

    type TextWithHighlightsProps = {
      children: React.ReactNode;
    };

    const isTextWithHighlights = (
      child: React.ReactElement
    ): child is React.ReactElement<TextWithHighlightsProps> => {
      return (
        React.isValidElement(child) &&
        typeof child.type !== 'string' &&
        typeof (child.props as TextWithHighlightsProps).children !== 'string'
      );
    };

    // Function to process individual elements
    const processElements = (
      elements: TextWithHighlightsArray | Array<React.ReactElement<LinkProps>>
    ) =>
      elements.map((el, i: number) => {
        if (el.type === 'a') {
          return (
            <CWTooltip
              key={i}
              content={el.props.href}
              placement="top"
              renderTrigger={(handleInteraction) => (
                <div
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                >
                  {el}
                </div>
              )}
            />
          );
        }
        return el;
      });

    // get text from doc and replace new lines with spaces
    const docText = getTextFromDelta(truncatedDoc)
      .replace(/\n/g, ' ')
      .replace(/\+/g, ' ');

    const textWithHighlights = renderTruncatedHighlights(searchTerm, docText);

    // Wrap all elements in a span to avoid container-based positioning
    const wrappedElements = React.Children.map(textWithHighlights, (child) => {
      if (isTextWithHighlights(child)) {
        if (child.type === 'a') {
          // Handle individual link element
          return processElements([child]);
        }
        if (
          Array.isArray(child.props.children) &&
          child.props.children.every(
            (el) => React.isValidElement(el) && typeof el.type !== 'string'
          )
        ) {
          // Handle a group of elements (e.g., a line of text)
          const processedChildren = processElements(
            child.props.children as TextWithHighlightsArray
          );
          return React.cloneElement(child, null, processedChildren);
        }
      }
      return child;
    });

    return <span>{wrappedElements}</span>;
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
