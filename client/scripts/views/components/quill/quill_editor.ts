import 'components/quill_editor.scss';

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { Tag, Tooltip } from 'construct-ui';

import app from 'state';
import SettingsController from 'controllers/app/settings';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import PreviewModal from 'views/modals/preview_modal';
import { instantiateEditor } from './instantiate_editor_helper';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

// Rich text and Markdown editor.
//
// When the editor is created, oncreateBind is called with the state
// object. This can be used to retrieve the editor and mode later.
//
// The editor can be toggled between rich text and markdown mode.
// Toggling reinitializes the editor, with or without a list of
// `formats` and the rich text toolbar (there doesn't appear to be a
// way to unregister formats once the editor has been initialized)

// Modified quill-auto-links for proper behavior with Markdown and pasting.

interface IQuillEditorAttrs {
  contentsDoc?;
  imageUploader?;
  oncreateBind;
  placeholder?: string;
  tabindex?: number;
  theme?: string;
  onkeyboardSubmit?;
  editorNamespace: string;
}

interface IQuillEditorState {
  editor;
  markdownMode;
  uploading?: boolean;
  // for localStorage drafts:
  beforeunloadHandler;
  alteredText: boolean;
  enableSubmission: boolean;
  unsavedChanges;
  clearUnsavedChanges;
}

const QuillEditor: m.Component<IQuillEditorAttrs, IQuillEditorState> = {
  oncreate: (vnode) => {
    // Only bind the alert if we are actually trying to persist the user's changes
    if (!vnode.attrs.contentsDoc) {
      vnode.state.beforeunloadHandler = () => {
        if (
          vnode.state.unsavedChanges &&
          vnode.state.unsavedChanges.length() > 0
        ) {
          return 'There are unsaved changes. Are you sure you want to leave?';
        }
      };
      $(window).on('beforeunload', vnode.state.beforeunloadHandler);
    }
  },
  onremove: (vnode) => {
    if (!vnode.attrs.contentsDoc) {
      $(window).off('beforeunload', vnode.state.beforeunloadHandler);
    }
  },
  view: (vnode) => {
    const theme = vnode.attrs.theme || 'snow';
    const {
      imageUploader,
      placeholder,
      tabindex,
      editorNamespace,
      onkeyboardSubmit,
    } = vnode.attrs;
    const oncreateBind = vnode.attrs.oncreateBind || (() => null);
    // If this component is running for the first time, and the parent has not provided contentsDoc,
    // try to load it from the drafts and also set markdownMode appropriately
    let contentsDoc = vnode.attrs.contentsDoc;
    if (
      !contentsDoc &&
      !vnode.state.markdownMode &&
      localStorage.getItem(
        `${app.activeChainId()}-${editorNamespace}-storedText`
      ) !== null
    ) {
      try {
        contentsDoc = JSON.parse(
          localStorage.getItem(
            `${app.activeChainId()}-${editorNamespace}-storedText`
          )
        );
        if (!contentsDoc.ops) throw new Error();
        vnode.state.markdownMode = false;
      } catch (e) {
        contentsDoc = localStorage.getItem(
          `${app.activeChainId()}-${editorNamespace}-storedText`
        );
        vnode.state.markdownMode = true;
      }
    } else if (vnode.state.markdownMode === undefined) {
      if (localStorage.getItem(`${editorNamespace}-markdownMode`) === 'true') {
        vnode.state.markdownMode = true;
      } else if (
        localStorage.getItem(`${editorNamespace}-markdownMode`) === 'false'
      ) {
        vnode.state.markdownMode = false;
      } else {
        // Otherwise, just set vnode.state.markdownMode based on the app setting
        vnode.state.markdownMode = !!app.user?.disableRichText;
      }
    }

    // Set vnode.state.clearUnsavedChanges on first initialization
    if (vnode.state.clearUnsavedChanges === undefined) {
      vnode.state.clearUnsavedChanges = () => {
        localStorage.removeItem(`${editorNamespace}-markdownMode`);
        localStorage.removeItem(
          `${app.activeChainId()}-${editorNamespace}-storedText`
        );
        localStorage.removeItem(
          `${app.activeChainId()}-${editorNamespace}-storedTitle`
        );
        if (
          localStorage.getItem(`${app.activeChainId()}-post-type`) === 'Link'
        ) {
          localStorage.removeItem(`${app.activeChainId()}-new-link-storedLink`);
        }
        localStorage.removeItem(`${app.activeChainId()}-post-type`);
      };
    }
    return m(
      '.QuillEditor',
      {
        class: vnode.state.markdownMode ? 'markdown-mode' : 'richtext-mode',
        oncreate: (childVnode) => {
          const $editor = $(childVnode.dom).find('.quill-editor');
          vnode.state.editor = instantiateEditor(
            $editor,
            theme,
            true,
            imageUploader,
            placeholder,
            editorNamespace,
            vnode.state,
            onkeyboardSubmit
          );
          // once editor is instantiated, it can be updated with a tabindex
          $(childVnode.dom).find('.ql-editor').attr('tabindex', tabindex);
          if (contentsDoc && typeof contentsDoc === 'string') {
            const res = vnode.state.editor.setText(contentsDoc);
            vnode.state.markdownMode = true;
          } else if (contentsDoc && typeof contentsDoc === 'object') {
            const res = vnode.state.editor.setContents(contentsDoc);
            vnode.state.markdownMode = false;
          }
          oncreateBind(vnode.state);
        },
      },
      [
        m('.quill-editor'),
        theme !== 'bubble' &&
          m('.type-selector', [
            vnode.state.markdownMode
              ? m(Tooltip, {
                  trigger: m(Tag, {
                    label: 'Markdown',
                    size: 'xs',
                    onclick: (e) => {
                      if (!vnode.state.markdownMode) return;
                      const cachedContents = vnode.state.editor.getContents();
                      // switch editor to rich text
                      vnode.state.markdownMode = false;
                      const $editor = $(e.target)
                        .closest('.QuillEditor')
                        .find('.quill-editor');
                      vnode.state.editor.container.tabIndex = tabindex;
                      vnode.state.editor = instantiateEditor(
                        $editor,
                        theme,
                        true,
                        imageUploader,
                        placeholder,
                        editorNamespace,
                        vnode.state,
                        onkeyboardSubmit
                      );
                      // once editor is instantiated, it can be updated with a tabindex
                      $(e.target)
                        .closest('.QuillEditor')
                        .find('.ql-editor')
                        .attr('tabindex', tabindex);
                      vnode.state.editor.setContents(cachedContents);
                      vnode.state.editor.setSelection(
                        vnode.state.editor.getText().length - 1
                      );
                      vnode.state.editor.focus();

                      // try to save setting
                      if (app.isLoggedIn()) {
                        SettingsController.disableRichText(false);
                      }
                    },
                  }),
                  content: m('.quill-editor-tooltip', 'Click for rich text'),
                })
              : m(Tooltip, {
                  trigger: m(Tag, {
                    label: 'Rich text',
                    size: 'xs',
                    onclick: async (e) => {
                      if (vnode.state.markdownMode) return;

                      // confirm before removing formatting and switching to markdown mode
                      // first, we check if removeFormat() actually does anything; then we ask the user to confirm
                      let confirmed = false;
                      let cachedContents = vnode.state.editor.getContents();
                      vnode.state.editor.removeFormat(
                        0,
                        vnode.state.editor.getText().length - 1
                      );
                      if (
                        vnode.state.editor.getContents().ops.length ===
                        cachedContents.ops.length
                      ) {
                        confirmed = true;
                      } else {
                        vnode.state.editor.setContents(cachedContents);
                        vnode.state.editor.setSelection(
                          vnode.state.editor.getText().length - 1
                        );
                      }
                      if (!confirmed) {
                        confirmed = await confirmationModalWithText(
                          'All formatting and images will be lost. Continue?'
                        )();
                      }
                      if (!confirmed) return;

                      // remove formatting, switch editor to markdown
                      vnode.state.editor.removeFormat(
                        0,
                        vnode.state.editor.getText().length - 1
                      );
                      cachedContents = vnode.state.editor.getContents();
                      vnode.state.markdownMode = true;
                      const $editor = $(e.target)
                        .closest('.QuillEditor')
                        .find('.quill-editor');
                      vnode.state.editor = instantiateEditor(
                        $editor,
                        theme,
                        true,
                        imageUploader,
                        placeholder,
                        editorNamespace,
                        vnode.state,
                        onkeyboardSubmit
                      );
                      // once editor is instantiated, it can be updated with a tabindex
                      $(e.target)
                        .closest('.QuillEditor')
                        .find('.ql-editor')
                        .attr('tabindex', tabindex);
                      vnode.state.editor.container.tabIndex = tabindex;
                      vnode.state.editor.setContents(cachedContents);
                      vnode.state.editor.setSelection(
                        vnode.state.editor.getText().length - 1
                      );
                      vnode.state.editor.focus();

                      // try to save setting
                      if (app.isLoggedIn()) {
                        SettingsController.disableRichText(true);
                      }
                    },
                  }),
                  content: m('.quill-editor-tooltip', 'Click for Markdown'),
                }),
          ]),
        m('.preview-button-wrap', [
          m(Tag, {
            label: m('.preview-button', [
              m(CWIcon, { iconName: 'search', iconSize: 'small ' }),
              m('span', 'Preview'),
            ]),
            size: 'xs',
            onclick: (e) => {
              e.preventDefault();
              app.modals.create({
                modal: PreviewModal,
                data: {
                  doc: vnode.state.markdownMode
                    ? vnode.state.editor.getText()
                    : JSON.stringify(vnode.state.editor.getContents()),
                },
              });
            },
          }),
        ]),
      ]
    );
  },
};

export default QuillEditor;
