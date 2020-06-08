import 'modals/version_history_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import Quill from 'quill';
import moment from 'moment-twitter';
import { OffchainThread, OffchainComment } from 'models';
import { CompactModalExitButton } from '../modal';
import QuillFormattedText from '../components/quill_formatted_text';
import MarkdownFormattedText from '../components/markdown_formatted_text';
const Delta = Quill.import('delta');

interface IVersionHistoryAttrs {
  proposal?: OffchainThread;
  comment?: OffchainComment<any>;
}

const VersionHistoryModal : m.Component<IVersionHistoryAttrs, {}> = {
  view: (vnode) => {
    const { proposal, comment } = vnode.attrs;
    const post = (proposal || comment);

    const formatDiff = (diff) => {
      for (const op of diff.ops) {
        // insertions cast in green:
        if (Object.prototype.hasOwnProperty.call(op, 'insert')) {
          op.attributes = {
            added: true
          };
        }
        // deletions cast in red & struckthru
        if (Object.prototype.hasOwnProperty.call(op, 'delete')) {
          op.retain = op.delete;
          delete op.delete;
          op.attributes = {
            deleted: true,
            strike: true
          };
        }
      }
      return diff;
    };

    const getVersion = (edit, prevEdit) => {
      edit = JSON.parse(edit);
      const timestamp = moment(edit.timestamp).format('dddd, MMMM Do YYYY, h:mm a');
      // TODO: Add diffing algorithm for Markdown posts
      try {
        const doc = new Delta(JSON.parse(edit.body));
        let diff; let quillDiff; let prevDoc;
        if (prevEdit) {
          try {
            prevDoc = new Delta(JSON.parse(JSON.parse(prevEdit).body));
          } catch (e) {
            prevDoc = false;
          }
          if (prevDoc) {
            diff = prevDoc.diff(doc);
            quillDiff = diff ? formatDiff(diff) : null;
          }
        }
        const diffedDoc = (quillDiff && prevDoc) ? prevDoc.compose(quillDiff) : doc;
        return m('.version', [
          m('span.timestamp', timestamp),
          m(QuillFormattedText, { doc: diffedDoc }),
        ]);
      } catch {
        return m('.version', [
          m('span.timestamp', timestamp),
          m(MarkdownFormattedText, { doc: edit.body })
        ]);
      }
    };

    return m('.VersionHistoryModal', [
      m('.compact-modal-title', [
        m('h3', 'Version History'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m('.versions', [
          post.versionHistory.map((edit, idx) => {
            const prevEdit = post.versionHistory[idx + 1];
            return getVersion(edit, prevEdit);
          })
        ]),
      ])
    ]);
  }
};

export default VersionHistoryModal;
