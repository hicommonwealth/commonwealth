import React, { useMemo, useState } from 'react';

import 'components/react_quill/quill_formatted_text.scss';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { getClasses } from '../component_kit/helpers';

import { useCommonNavigate } from 'navigation/helpers';
import { DeltaStatic } from 'quill';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import { renderTruncatedHighlights } from './highlighter';
import { QuillRendererProps } from './quill_renderer';
import { renderQuillDelta } from './render_quill_delta';
import { countLinesQuill, getTextFromDelta } from './utils';

type QuillFormattedTextProps = Omit<QuillRendererProps, 'doc'> & {
  doc: DeltaStatic;
};

type TextWithHighlightsProps = {
  children: React.ReactNode;
};

type TextWithHighlightsArray = Array<
  React.ReactElement<TextWithHighlightsProps>
>;

type LinkProps = {
  href: string;
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
        navigate,
      );
    }

    /**
     * Type guard function to check if a React element is a TextWithHighlights element.
     *
     * @param {React.ReactElement} child - The React element to check.
     * @returns {child is React.ReactElement<TextWithHighlightsProps>} - True if the element is a TextWithHighlights element, false otherwise.
     */
    const isTextWithHighlights = (
      child: React.ReactElement,
    ): child is React.ReactElement<TextWithHighlightsProps> => {
      return (
        React.isValidElement(child) &&
        typeof child.type !== 'string' &&
        typeof (child.props as TextWithHighlightsProps).children !== 'string'
      );
    };

    // Function to process individual elements
    const processElements = (
      elements: TextWithHighlightsArray | Array<React.ReactElement<LinkProps>>,
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
            (el) => React.isValidElement(el) && typeof el.type !== 'string',
          )
        ) {
          // Handle a group of elements (e.g., a line of text)
          const processedChildren = processElements(
            child.props.children as TextWithHighlightsArray,
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
          'MarkdownFormattedText',
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
