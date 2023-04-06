import React from 'react';
import { QuillFormattedText } from '../quill/quill_formatted_text';
import { MarkdownFormattedText } from './markdown_formatted_text';

type QuillRendererProps = {
  doc: string;
  searchTerm?: string;
  hideFormatting?: boolean;
};

export const QuillRenderer = ({ doc, searchTerm, hideFormatting }: QuillRendererProps) => {
  let decodedTextbody: string;
  try {
    decodedTextbody = decodeURIComponent(doc);
  } catch (e) {
    decodedTextbody = doc;
  }

  try {
    const parsedDoc = JSON.parse(decodedTextbody);
    if (!parsedDoc.ops) {
      throw new Error('failed to parse doc as JSON');
    }
    return <QuillFormattedText hideFormatting={hideFormatting} doc={parsedDoc} searchTerm={searchTerm} />;
  } catch (e) {
    return <MarkdownFormattedText hideFormatting={hideFormatting} doc={decodedTextbody} searchTerm={searchTerm} />;
  }
};
