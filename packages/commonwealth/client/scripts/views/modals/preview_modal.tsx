/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import 'modals/preview_modal.scss';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { MarkdownFormattedText } from 'views/components/quill/markdown_formatted_text';

import { QuillFormattedText } from 'views/components/quill/quill_formatted_text';
import { CWText } from '../components/component_kit/cw_text';

class PreviewModalEmptyState extends ClassComponent {
  view() {
    return (
      <div class="empty-state-container">
        <CWText type="h5" fontWeight="semiBold" className="empty-text">
          Nothing to preview
        </CWText>
      </div>
    );
  }
}

type PreviewModalAttrs = {
  doc: string;
  title: string;
};

export class PreviewModal extends ClassComponent<PreviewModalAttrs> {
  view(vnode: m.Vnode<PreviewModalAttrs>) {
    const { title } = vnode.attrs;

    return (
      <div class="PreviewModal">
        <div class="compact-modal-title">
          <h3>{title ? `Preview: ${title}` : 'Preview'}</h3>
          <ModalExitButton />
        </div>
        <div class="compact-modal-body">
          {(() => {
            try {
              const doc = JSON.parse(vnode.attrs.doc);
              if (!doc.ops) throw new Error();
              if (doc.ops.length === 1 && doc.ops[0].insert === '\n') {
                return <PreviewModalEmptyState />;
              }
              return m(QuillFormattedText, { doc });
            } catch (e) {
              if (vnode.attrs.doc.trim() === '') {
                return <PreviewModalEmptyState />;
              }
              return <MarkdownFormattedText doc={vnode.attrs.doc} />;
            }
          })()}
        </div>
      </div>
    );
  }
}
