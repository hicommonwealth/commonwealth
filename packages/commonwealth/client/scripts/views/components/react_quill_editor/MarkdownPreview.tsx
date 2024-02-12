import { DeltaStatic } from 'quill';
import React from 'react';
import { QuillRenderer } from './quill_renderer';

type MarkdownPreviewProps = {
  doc: DeltaStatic | string;
};

export const MarkdownPreview = ({ doc }: MarkdownPreviewProps) => {
  console.log('doc', doc);
  return (
    <div className="MarkdownPreview">
      <QuillRenderer
        doc={typeof doc === 'string' ? doc : JSON.stringify(doc)}
      />
    </div>
  );
};
