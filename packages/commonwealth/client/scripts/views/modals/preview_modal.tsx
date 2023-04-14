import 'modals/preview_modal.scss';
import type { DeltaStatic } from 'quill';
import React from 'react';

import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { QuillRenderer } from '../components/react_quill_editor/quill_renderer';

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
