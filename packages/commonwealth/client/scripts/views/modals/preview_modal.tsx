import type { DeltaStatic } from 'quill';
import React from 'react';
import {
  CWModalBody,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { QuillRenderer } from '../components/react_quill_editor/quill_renderer';

import '../../../styles/modals/preview_modal.scss';

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
      <CWModalBody>
        <QuillRenderer
          doc={typeof doc === 'string' ? doc : JSON.stringify(doc)}
        />
      </CWModalBody>
    </div>
  );
};
