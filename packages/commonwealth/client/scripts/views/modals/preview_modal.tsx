import React, { useMemo } from 'react';

import 'modals/preview_modal.scss';

import { QuillFormattedText } from 'views/components/quill/quill_formatted_text';
import { CWText } from '../components/component_kit/cw_text';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import type { DeltaStatic } from 'quill';
import { MarkdownFormattedText } from '../components/react_quill_editor/markdown_formatted_text';

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

export const PreviewModal = ({ doc, onModalClose, title }: PreviewModalProps) => {
  const renderedContent = useMemo(() => {
    if (!doc) {
      return <EmptyState />;
    }
    // render as markdown
    if (typeof doc === 'string') {
      if (doc.length === 0) {
        return <EmptyState />;
      }
      return <MarkdownFormattedText doc={doc} />;
    }
    if (!doc.ops?.length) {
      return <EmptyState />;
    }
    return <QuillFormattedText doc={doc} />;
  }, [doc]);

  return (
    <div className="PreviewModal">
      <div className="compact-modal-title">
        <h3>{title ? `Preview: ${title}` : 'Preview'}</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">{renderedContent}</div>
    </div>
  );
};
