import 'modals/new_topic_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, FormLabel, Checkbox } from 'construct-ui';

import QuillEditor from 'views/components/quill_editor';
import { CompactModalExitButton } from 'views/modal';

interface INewTopicModalForm {
  id: number,
  name: string,
  description: string,
  featured_in_sidebar: boolean,
  featured_in_new_post: boolean,
}

const NewTopicModal: m.Component<{
  id: number,
  name: string,
  description: string,
  featured_in_sidebar: boolean,
  featured_in_new_post: boolean,
}, {
  error: any,
  form: INewTopicModalForm,
  saving: boolean,
  quillEditorState,
}> = {
  view: (vnode) => {
    if (!app.user.isSiteAdmin && !app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, name, description, featured_in_sidebar, featured_in_new_post } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, featured_in_sidebar, featured_in_new_post };
    }
    let disabled = false;
    if (!vnode.state.form.name || !vnode.state.form.name.trim()) disabled = true;

    if (vnode.state.form.featured_in_new_post
      && vnode.state.quillEditorState
      && vnode.state.quillEditorState.editor
      && vnode.state.quillEditorState.editor.editor.isBlank()
    ) {
      console.log(vnode.state.quillEditorState.editor.editor.isBlank());
      disabled = true;
    }

    return m('.NewTopicModal', [
      m('.compact-modal-title', [
        m('h3', 'New topic'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(Form, [
          m(FormGroup, [
            m(FormLabel, { for: 'name' }, 'Name'),
            m(Input, {
              title: 'Name',
              name: 'name',
              class: 'topic-form-name',
              tabindex: 1,
              defaultValue: vnode.state.form.name,
              autocomplete: 'off',
              oncreate: (vvnode) => {
                // use oncreate to focus because autofocus: true fails when component is recycled in a modal
                setTimeout(() => $(vvnode.dom).find('input').focus(), 0);
              },
              oninput: (e) => {
                vnode.state.form.name = (e.target as any).value;
              },
            }),
          ]),
          m(FormGroup, [
            m(FormLabel, { for: 'description' }, 'Description'),
            m(Input, {
              title: 'Description',
              class: 'topic-form-description',
              tabindex: 2,
              defaultValue: vnode.state.form.description,
              oninput: (e) => {
                vnode.state.form.description = (e.target as any).value;
              }
            }),
          ]),
          m(FormGroup, [
            m(Checkbox, {
              label: 'Featured in Sidebar',
              checked: vnode.state.form.featured_in_sidebar,
              onchange: (e) => {
                vnode.state.form.featured_in_sidebar = !vnode.state.form.featured_in_sidebar;
              },
            }),
          ]),
          m(FormGroup, [
            m(Checkbox, {
              label: 'Featured in New Post',
              checked: vnode.state.form.featured_in_new_post,
              onchange: (e) => {
                vnode.state.form.featured_in_new_post = !vnode.state.form.featured_in_new_post;
              },
            }),
          ]),
          vnode.state.form.featured_in_new_post && m(FormGroup, [
            m(QuillEditor, {
              contentsDoc: '',
              oncreateBind: (state) => {
                vnode.state.quillEditorState = state;
              },
              editorNamespace: 'new-discussion',
              imageUploader: true,
              tabindex: 3,
            }),
          ]),
          m(Button, {
            intent: 'primary',
            disabled: vnode.state.saving || disabled,
            rounded: true,
            onclick: async (e) => {
              e.preventDefault();
              const { quillEditorState, form } = vnode.state;

              if (quillEditorState) {
                quillEditorState.editor.enable(false);
              }

              const mentionsEle = document.getElementsByClassName('ql-mention-list-container')[0];
              if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';
              const default_offchain_template = !quillEditorState ? ''
                : quillEditorState.markdownMode
                  ? quillEditorState.editor.getText()
                  : JSON.stringify(quillEditorState.editor.getContents());

              app.topics.add(
                form.name,
                form.description,
                null,
                form.featured_in_sidebar,
                form.featured_in_new_post,
                default_offchain_template
              ).then(() => {
                vnode.state.saving = false;
                m.redraw();
                $(e.target).trigger('modalexit');
              }).catch(() => {
                vnode.state.error = 'Error creating topic';
                vnode.state.saving = false;
                m.redraw();
              });
            },
            label: 'Create topic',
          }),
          vnode.state.error && m('.error-message', vnode.state.error),
        ]),
      ])
    ]);
  }
};

export default NewTopicModal;
