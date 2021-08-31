import 'modals/new_stage_modal.scss';

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, FormLabel, Checkbox } from 'construct-ui';

import QuillEditor from 'views/components/quill_editor';
import { CompactModalExitButton } from 'views/modal';

interface INewStageModalForm {
  id: number,
  name: string,
  description: string,
  featuredInSidebar: boolean,
  featuredInNewPost: boolean,
}

const NewStageModal: m.Component<{
  id: number,
  name: string,
  description: string,
  featuredInSidebar: boolean,
  featuredInNewPost: boolean,
}, {
  error: any,
  form: INewStageModalForm,
  saving: boolean,
  quillEditorState,
}> = {
  view: (vnode) => {
    if (!app.user.isSiteAdmin && !app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, name, description, featuredInSidebar, featuredInNewPost } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, featuredInSidebar, featuredInNewPost };
    }

    let disabled = false;
    if (!vnode.state.form.name || !vnode.state.form.name.trim()) disabled = true;

    if (vnode.state.form.featuredInNewPost
      && vnode.state.quillEditorState
      && vnode.state.quillEditorState.editor
      && vnode.state.quillEditorState.editor.editor.isBlank()
    ) {
      disabled = true;
    }

    return m('.NewStageModal', [
      m('.compact-modal-title', [
        m('h3', 'New stage'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(Form, [
          m(FormGroup, [
            m(FormLabel, { for: 'name' }, 'Name'),
            m(Input, {
              title: 'Name',
              name: 'name',
              class: 'stage-form-name',
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
              class: 'stage-form-description',
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
              checked: vnode.state.form.featuredInSidebar,
              onchange: (e) => {
                vnode.state.form.featuredInSidebar = !vnode.state.form.featuredInSidebar;
              },
            }),
          ]),
          m(FormGroup, [
            m(Checkbox, {
              label: 'Featured in New Post',
              checked: vnode.state.form.featuredInNewPost,
              onchange: (e) => {
                vnode.state.form.featuredInNewPost = !vnode.state.form.featuredInNewPost;
              },
            }),
          ]),
          vnode.state.form.featuredInNewPost && m(FormGroup, [
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
              const defaultOffchainTemplate = !quillEditorState ? ''
                : quillEditorState.markdownMode
                  ? quillEditorState.editor.getText()
                  : JSON.stringify(quillEditorState.editor.getContents());

              app.stages.add(
                vnode.state.form.name,
                vnode.state.form.description,
                vnode.state.form.featuredInSidebar,
                vnode.state.form.featuredInNewPost,
                defaultOffchainTemplate
              ).then(() => {
                vnode.state.saving = false;
                m.redraw();
                $(e.target).trigger('modalexit');
              }).catch(() => {
                vnode.state.error = 'Error creating stage';
                vnode.state.saving = false;
                m.redraw();
              });
            },
            label: 'Create stage',
          }),
          vnode.state.error && m('.error-message', vnode.state.error),
        ]),
      ])
    ]);
  }
};

export default NewStageModal;
