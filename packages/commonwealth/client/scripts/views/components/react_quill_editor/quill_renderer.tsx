import { DeltaStatic } from 'quill';
import React, { ReactNode, useMemo } from 'react';
import { MarkdownFormattedText } from './markdown_formatted_text';
import { QuillFormattedText } from './quill_formatted_text';
import { SerializableDeltaStatic, getTextFromDelta } from './utils';

export type QuillRendererProps = {
  doc: string;
  hideFormatting?: boolean;
  openLinksInNewTab?: boolean;
  searchTerm?: string;
  containerClass?: string;
  markdownCutoffLength?: number; // Sometimes necessary to prevent large markdown docs from slowing down pages
  customClass?: string;
  customShowMoreButton?: ReactNode;
  maxChars?: number;
  onImageClick?: () => void;
  isCardView?: boolean;
  cutoffLines?: number;
};

type RichTextDocInfo = { format: 'richtext'; content: DeltaStatic };
type MarkdownDocInfo = { format: 'markdown'; content: string };
type UnknownDocInfo = { format: 'unknown'; content: null };
type DocInfo = RichTextDocInfo | MarkdownDocInfo | UnknownDocInfo;

// QuillRenderer is the way to render both richtext and markdown quill content
export const QuillRenderer = ({
  doc,
  searchTerm,
  hideFormatting,
  containerClass,
  markdownCutoffLength,
  customClass,
  customShowMoreButton = null,
  maxChars,
  onImageClick,
  cutoffLines,
}: QuillRendererProps) => {
  const docInfo: DocInfo = useMemo(() => {
    let decodedText: string;
    try {
      decodedText = decodeURIComponent(doc);
    } catch (e) {
      decodedText = doc;
    }

    try {
      let delta: DeltaStatic;
      //Checks to ensure it is in JSON format
      if (decodedText.startsWith('{')) {
        delta = JSON.parse(decodedText) as DeltaStatic;
      } else {
        throw new Error('Not JSON');
      }

      if (!delta.ops) {
        console.error('parsed doc as JSON but has no ops');
        return {
          format: 'unknown',
          content: null,
        } as UnknownDocInfo;
      }

      // if it's markdown but not properly serialized...
      if ((delta as SerializableDeltaStatic).___isMarkdown) {
        return {
          format: 'markdown',
          content: getTextFromDelta(delta),
        } as MarkdownDocInfo;
      }
      return {
        format: 'richtext',
        content: delta,
      } as RichTextDocInfo;
    } catch (err) {
      // otherwise it's a markdown string
      return {
        format: 'markdown',
        content: decodedText,
      } as MarkdownDocInfo;
    }
  }, [doc]);

  const renderedDoc = useMemo(() => {
    switch (docInfo.format) {
      case 'richtext':
        return (
          <QuillFormattedText
            hideFormatting={hideFormatting}
            doc={docInfo.content}
            searchTerm={searchTerm}
            customShowMoreButton={customShowMoreButton}
            maxChars={maxChars}
            cutoffLines={cutoffLines}
          />
        );
      case 'markdown':
        return (
          <MarkdownFormattedText
            hideFormatting={hideFormatting}
            doc={
              markdownCutoffLength
                ? docInfo.content.slice(0, markdownCutoffLength)
                : docInfo.content
            }
            searchTerm={searchTerm}
            customClass={customClass}
            customShowMoreButton={customShowMoreButton}
            maxChars={maxChars}
            onImageClick={onImageClick}
            cutoffLines={cutoffLines}
          />
        );
      default:
        return <>N/A</>;
    }
  }, [
    hideFormatting,
    searchTerm,
    docInfo.content,
    docInfo.format,
    markdownCutoffLength,
    customClass,
    customShowMoreButton,
    maxChars,
    onImageClick,
    cutoffLines,
  ]);

  if (containerClass) {
    return <div className={containerClass}>{renderedDoc}</div>;
  }

  return renderedDoc;
};
