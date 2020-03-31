import 'pages/new_thread.scss';

import m, { VnodeDOM } from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import app from 'state';

import ObjectPage from 'views/pages/_object_page';
import { TextInputFormField, ButtonSelectorFormField } from 'views/components/forms';
import PreviewModal from 'views/modals/preview_modal';
import User from 'views/components/widgets/user';
import QuillEditor from 'views/components/quill_editor';
import { newThread } from '.';
import AutoCompleteTagForm from '../../components/autocomplete_tag_form';
import PageLoading from '../loading';

const TitleComponent = (vnode, author) => {
  return m(TextInputFormField, {
    options: {
      name: 'title',
      placeholder: 'Title',
      disabled: !author,
      oncreate: () => $(vnode.dom).focus(),
      autocomplete: 'off',
      tabindex: 1,
    },
    callback: (result) => {
      vnode.state.form.title = result;
    },
  });
};

const NewLinkEditorComponent = (vnode) => {
  return m(QuillEditor, {
    contentsDoc: '',
    oncreateBind: (state) => {
      vnode.state.quillEditorState = state;
    },
    tabindex: 2,
    editorNamespace: 'new-link',
  });
};

const ActionsComponent = (vnode, author) => {
  let buttonMsg;
  if (author) {
    buttonMsg = (vnode.state.uploadsInProgress > 0) ? 'Uploading...' : 'Create thread';
  } else {
    buttonMsg = 'Setup required';
  }

  return m('.actions', [
    m('button', {
      class: !author || vnode.state.uploadsInProgress > 0 ? 'disabled' : '',
      type: 'submit',
      onclick: (e) => {
        e.preventDefault();
        vnode.state.error = newThread(vnode.state.form, vnode.state.quillEditorState, author);
      },
      tabindex: 5,
    }, buttonMsg),
    m('button', {
      class: !author || vnode.state.uploadsInProgress > 0 ? 'disabled' : 'preview-button',
      type: 'submit',
      onclick: (e) => {
        const markdownMode = $(e.target).closest('.NewThreadPage').find('.QuillEditor').hasClass('markdown-mode');
        e.preventDefault();
        app.modals.create({
          modal: PreviewModal,
          data: {
            title: vnode.state.form.title,
            doc: markdownMode
              ? vnode.state.quillEditorState.editor.getText()
              : JSON.stringify(vnode.state.quillEditorState.editor.getContents()),
          },
        });
      },
      tabindex: 4,
    }, 'Preview'),
  ]);
};

const AutoCompleteComponent = (vnode, activeEntity) => {
  return m(AutoCompleteTagForm, {
    results: activeEntity.meta.tags || [],
    updateFormData: (tags: string[]) => {
      vnode.state.form.tags = tags;
    },
    updateParentErrors: (err: string) => {
      if (err) vnode.state.error = err;
      else delete vnode.state.error;
      m.redraw();
    },
    tabindex: 3,
  });
};

const NewThreadPage = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'NewThreadPage' });
  },
  view: (vnode) => {
    if (!app.isLoggedIn()) {
      m.route.set(`/${app.activeChainId()}/login`, {}, { replace: true });
    } else {
      const activeEntity = app.community ? app.community : app.chain;
      if (!activeEntity) return m(PageLoading);

      const author = app.vm.activeAccount;

      // init;
      if (!vnode.state.form) {
        vnode.state.form = {};
      }

      if (vnode.state.uploadsInProgress === undefined) {
        vnode.state.uploadsInProgress = 0;
      }

      const { error } = vnode.state;

      return m(ObjectPage, {
        class: 'NewThreadPage',
        content: activeEntity && [
          m('.forum-container', [
            m('h2.page-title', 'New Thread'),
            m('.row', [
              m('.new-thread-left.col-sm-1', [
                author && m(User, { user: author, avatarOnly: true, avatarSize: 48 }),
              ]),
              m('.new-thread-center.col-sm-8', [
                TitleComponent(vnode, author),
                NewLinkEditorComponent(vnode),
                // m(DropzoneTextarea, {
                //   showPreviewButton: true,
                //   placeholder: 'Type here...',
                //   //disabled: !author),
                //   uploadStartedCallback: () => {
                //     vnode.state.uploadsInProgress++;
                //     m.redraw();
                //   },
                //   uploadCompleteCallback: (files) => {
                //     vnode.state.files = files;
                //     vnode.state.uploadsInProgress--;
                //     // update textarea
                //     files.map((f) => {
                //       if (!f.uploadURL) return;
                //       let text = $(vnode.dom).find('textarea').val();
                //       text = text + '\n[' + f.uploadURL.replace(/\?.*/, '') + ']';
                //       $(vnode.dom).find('textarea').val(text.trim());
                //     });
                //     m.redraw();
                //   },
                // }),
                m('.bottom-panel', [
                  ActionsComponent(vnode, author),
                  AutoCompleteComponent(vnode, activeEntity)
                ]),
                error
                && (typeof error === 'string' || Object.keys(error).length)
                  ? m('.error-message', [
                    (typeof error === 'string')
                      ? m('span', error)
                      : Object.values(error).map((val) => m('span', `${val} `)),
                  ])
                  : m('.error-placeholder'),
              ]),
              m('.new-thread-right.col-sm-3', [
                // m('h3', 'Display Options'),
                // m('.signaling-options', [
                //   m('h4', 'Discussion Thread'),
                //   m('p', [
                //     `Large text. Comments displayed underneath the main post.`,
                //   ]),
                // ]),
              ]),
            ]),
          ]),
        ],
      });
    }
  },
};

export default NewThreadPage;
