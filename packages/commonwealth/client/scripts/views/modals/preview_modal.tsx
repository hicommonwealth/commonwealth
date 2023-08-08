import React from 'react';
import { X } from '@phosphor-icons/react';
import type { DeltaStatic } from 'quill';

import { QuillRenderer } from '../components/react_quill_editor/quill_renderer';
import { CWText } from '../components/component_kit/cw_text';

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
      <div className="compact-modal-title">
        <CWText className="title-text" type="h4">
          {title ? `Preview: ${title}` : 'Preview'}
        </CWText>
        <X className="close-icon" onClick={() => onModalClose()} size={24} />
      </div>
      <div className="compact-modal-body">
        <QuillRenderer
          doc={typeof doc === 'string' ? doc : JSON.stringify(doc)}
        />
      </div>
    </div>
  );
};
