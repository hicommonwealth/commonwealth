import React from 'react';
import type { DeltaStatic } from 'quill';

import { QuillRenderer } from '../components/react_quill_editor/quill_renderer';
import { CWModalHeader } from './CWModalHeader';

import 'modals/preview_modal.scss';

type PreviewModalProps = {
  doc: DeltaStatic | string;
  onModalClose: () => void;
  title: string;
};

export const PreviewModal = ({
  doc,
  onModalClose,
  title,
}: PreviewModalProps) => {
  return (
    <div className="PreviewModal">
      <CWModalHeader
        label={title ? `Preview: ${title}` : 'Preview'}
        onModalClose={onModalClose}
      />
      <div className="compact-modal-body">
        <QuillRenderer
          doc={typeof doc === 'string' ? doc : JSON.stringify(doc)}
        />
      </div>
    </div>
  );
};
