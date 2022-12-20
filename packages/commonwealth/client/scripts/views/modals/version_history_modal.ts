// Gabe 12/13/22 - Keeping this around for future reference per Zak

// import 'modals/version_history_modal.scss';

// 
// import app from 'state';
// import Quill from 'quill';
// import { Thread, Comment } from 'models';
// import { QuillFormattedText } from 'views/components/quill/quill_formatted_text';
// import { MarkdownFormattedText } from 'views/components/quill/markdown_formatted_text';
// import User from 'views/components/widgets/user';
// import { VersionHistory } from 'controllers/server/threads';
// import { ModalExitButton } from 'views/components/component_kit/cw_modal';
// import { CWSpinner } from '../components/component_kit/cw_spinner';
// const Delta = Quill.import('delta');

// interface IVersionHistoryAttrs {
//   item: Thread | Comment<any>;
// }

// const VersionHistoryModal: Component<IVersionHistoryAttrs, {}> = {
//   view: (vnode) => {
//     const { item } = vnode.attrs;
//     if (!item) return;

//     const formatDiff = (diff) => {
//       for (const op of diff.ops) {
//         // insertions cast in green:
//         if (Object.prototype.hasOwnProperty.call(op, 'insert')) {
//           op.attributes = {
//             added: true,
//           };
//         }
//         // deletions cast in red & struckthru
//         if (Object.prototype.hasOwnProperty.call(op, 'delete')) {
//           op.retain = op.delete;
//           delete op.delete;
//           op.attributes = {
//             deleted: true,
//             strike: true,
//           };
//         }
//       }
//       return diff;
//     };

//     const getVersion = (edit: VersionHistory, prevEdit: VersionHistory) => {
//       const author = edit.author
//         ? app.profiles.getProfile(edit.author.chain, edit.author.address)
//         : app.profiles.getProfile(item.authorChain, item.author);
//       const timestamp = edit.timestamp.format('dddd, MMMM Do YYYY, h:mm a');
//       const userOptions = {
//         user: author,
//         showRole: false,
//         linkify: true,
//         popover: false,
//         hideAvatar: true,
//       };
//       // TODO: Add diffing algorithm for Markdown posts
//       try {
//         const doc = new Delta(JSON.parse(edit.body));
//         let diff;
//         let quillDiff;
//         let prevDoc;
//         if (prevEdit) {
//           try {
//             prevDoc = new Delta(JSON.parse(prevEdit.body));
//           } catch (e) {
//             prevDoc = false;
//           }
//           if (prevDoc) {
//             diff = prevDoc.diff(doc);
//             quillDiff = diff ? formatDiff(diff) : null;
//           }
//         }
//         const diffedDoc =
//           quillDiff && prevDoc ? prevDoc.compose(quillDiff) : doc;
//         return render('.version', [
//           render('.panel-left', [
//             render(User, userOptions),
//             render('span.timestamp', timestamp),
//           ]),
//           render('.panel-right', [render(QuillFormattedText, { doc: diffedDoc })]),
//         ]);
//       } catch {
//         return render('.version', [
//           render('.panel-left', [
//             render(User, userOptions),
//             render('span.timestamp', timestamp),
//           ]),
//           render('.panel-right', [render(MarkdownFormattedText, { doc: edit.body })]),
//         ]);
//       }
//     };

//     return render('.VersionHistoryModal', [
//       render('.compact-modal-title', [
//         render('h3', 'Version History'),
//         render(ModalExitButton),
//       ]),
//       render('.compact-modal-body', [
//         item.versionHistory && item.versionHistory?.length
//           ? render('.versions', [
//               item.versionHistory.map((edit, idx) => {
//                 const prevEdit = item.versionHistory[idx + 1];
//                 if (!edit) return null;
//                 return getVersion(edit, prevEdit);
//               }),
//             ])
//           : render('.versions.versions-loading', [render(CWSpinner)]),
//       ]),
//     ]);
//   },
// };

// export default VersionHistoryModal;
