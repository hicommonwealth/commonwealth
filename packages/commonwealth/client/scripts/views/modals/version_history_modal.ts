import 'modals/version_history_modal.scss';

import m from 'mithril';
import app from 'state';
import Quill from 'quill';
import { Thread, Comment } from 'models';
import QuillFormattedText from 'views/components/quill_formatted_text';
import { MarkdownFormattedText } from 'views/components/markdown_formatted_text';
import User from 'views/components/widgets/user';
import { VersionHistory } from 'controllers/server/threads';
import { Spinner } from 'construct-ui';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
const Delta = Quill.import('delta');

interface IVersionHistoryAttrs {
  item: Thread | Comment<any>;
}

const VersionHistoryModal: m.Component<IVersionHistoryAttrs, {}> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;

    const formatDiff = (diff) => {
      for (const op of diff.ops) {
        // insertions cast in green:
        if (Object.prototype.hasOwnProperty.call(op, 'insert')) {
          op.attributes = {
            added: true,
          };
        }
        // deletions cast in red & struckthru
        if (Object.prototype.hasOwnProperty.call(op, 'delete')) {
          op.retain = op.delete;
          delete op.delete;
          op.attributes = {
            deleted: true,
            strike: true,
          };
        }
      }
      return diff;
    };

    const getVersion = (edit: VersionHistory, prevEdit: VersionHistory) => {
      const author = edit.author
        ? app.profiles.getProfile(edit.author.chain, edit.author.address)
        : app.profiles.getProfile(item.authorChain, item.author);
      const timestamp = edit.timestamp.format('dddd, MMMM Do YYYY, h:mm a');
      const userOptions = {
        user: author,
        showRole: false,
        linkify: true,
        popover: false,
        hideAvatar: true,
      };
      // TODO: Add diffing algorithm for Markdown posts
      try {
        const doc = new Delta(JSON.parse(edit.body));
        let diff;
        let quillDiff;
        let prevDoc;
        if (prevEdit) {
          try {
            prevDoc = new Delta(JSON.parse(prevEdit.body));
          } catch (e) {
            prevDoc = false;
          }
          if (prevDoc) {
            diff = prevDoc.diff(doc);
            quillDiff = diff ? formatDiff(diff) : null;
          }
        }
        const diffedDoc =
          quillDiff && prevDoc ? prevDoc.compose(quillDiff) : doc;
        return m('.version', [
          m('.panel-left', [
            m(User, userOptions),
            m('span.timestamp', timestamp),
          ]),
          m('.panel-right', [m(QuillFormattedText, { doc: diffedDoc })]),
        ]);
      } catch {
        return m('.version', [
          m('.panel-left', [
            m(User, userOptions),
            m('span.timestamp', timestamp),
          ]),
          m('.panel-right', [m(MarkdownFormattedText, { doc: edit.body })]),
        ]);
      }
    };

    return m('.VersionHistoryModal', [
      m('.compact-modal-title', [
        m('h3', 'Version History'),
        m(ModalExitButton),
      ]),
      m('.compact-modal-body', [
        item.versionHistory && item.versionHistory?.length
          ? m('.versions', [
              item.versionHistory.map((edit, idx) => {
                const prevEdit = item.versionHistory[idx + 1];
                if (!edit) return null;
                return getVersion(edit, prevEdit);
              }),
            ])
          : m('.versions.versions-loading', [m(Spinner, { active: true })]),
      ]),
    ]);
  },
};

export default VersionHistoryModal;
