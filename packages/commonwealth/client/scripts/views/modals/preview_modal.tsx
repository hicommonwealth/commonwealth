import React from 'react';

import 'modals/preview_modal.scss';

import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { MarkdownFormattedText } from 'views/components/quill/markdown_formatted_text';
import { QuillFormattedText } from 'views/components/quill/quill_formatted_text';
import { CWText } from '../components/component_kit/cw_text';

type PreviewModalProps = {
  doc: string;
};

export const PreviewModal = ({ doc }: PreviewModalProps) => {
  return (
    <div className="PreviewModal">
      <div className="compact-modal-title">
        <h3>Preview</h3>
        <ModalExitButton />
      </div>
      <div className="compact-modal-body">
        {(() => {
          try {
            const internalDoc = JSON.parse(doc);

            if (!internalDoc.ops) throw new Error();

            if (
              internalDoc.ops.length === 1 &&
              internalDoc.ops[0].insert === '\n'
            ) {
              return (
                <div className="empty-state-container">
                  <CWText
                    type="h5"
                    fontWeight="semiBold"
                    className="empty-text"
                  >
                    Nothing to preview
                  </CWText>
                </div>
              );
            }
            return <QuillFormattedText doc={internalDoc} />;
          } catch (e) {
            if (doc.trim() === '') {
              return (
                <div className="empty-state-container">
                  <CWText
                    type="h5"
                    fontWeight="semiBold"
                    className="empty-text"
                  >
                    Nothing to preview
                  </CWText>
                </div>
              );
            }

            return doc && <MarkdownFormattedText doc={doc} />;
          }
        })()}
      </div>
    </div>
  );
};
