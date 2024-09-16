import { DeltaStatic } from 'quill';
import React from 'react';
import { QuillRenderer } from './quill_renderer';

type MarkdownPreviewProps = {
  classNameProp: string;
  doc: DeltaStatic | string;
};

export const MarkdownPreview = ({
  doc,
  classNameProp,
}: MarkdownPreviewProps) => {
  return (
    <div className={classNameProp ? 'preview' : 'MarkdownPreview'}>
      <QuillRenderer
        doc={typeof doc === 'string' ? doc : JSON.stringify(doc)}
      />
    </div>
  );
};
