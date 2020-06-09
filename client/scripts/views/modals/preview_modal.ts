import 'modals/preview_modal.scss';

import m from 'mithril';
import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import { CompactModalExitButton } from 'views/modal';

const PreviewModal: m.Component<{ title: string, doc: string }> = {
  view: (vnode) => {
    const title = vnode.attrs.title;

    return m('.PreviewModal', [
      m('.compact-modal-title', [
        m('h3', title ? `Preview: ${title}` : 'Preview'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', (() => {
        try {
          const doc = JSON.parse(vnode.attrs.doc);
          if (doc.ops.length === 1 && doc.ops[0].insert === '\n') {
            return m('.empty-preview', 'Nothing to preview');
          }
          return m(QuillFormattedText, { doc });
        } catch (e) {
          if (vnode.attrs.doc.trim() === '') {
            return m('.empty-preview', 'Nothing to preview');
          }
          return m(MarkdownFormattedText, { doc: vnode.attrs.doc });
        }
      })()),
    ]);
  }
};

export default PreviewModal;
