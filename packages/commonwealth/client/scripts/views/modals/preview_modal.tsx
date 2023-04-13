import React from 'react';

import 'modals/preview_modal.scss';

import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import type { DeltaStatic } from 'quill';
import { QuillRenderer } from '../components/react_quill_editor/quill_renderer';

const EmptyState = () => {
  return (
    <div className="empty-state-container">
      <CWText type="h5" fontWeight="semiBold" className="empty-text">
        Nothing to preview
      </CWText>
    </div>
  );
};

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
        <h3>{title ? `Preview: ${title}` : 'Preview'}</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
        <QuillRenderer
          doc={typeof doc === 'string' ? doc : JSON.stringify(doc)}
        />
      </div>
    </div>
  );
};
