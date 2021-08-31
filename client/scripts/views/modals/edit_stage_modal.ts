import 'modals/edit_stage_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, FormLabel, Checkbox } from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import QuillEditor from 'views/components/quill_editor';
import { CompactModalExitButton } from 'views/modal';

interface IEditStageModalForm {
  description: string,
  id: number,
  name: string,
  featuredInSidebar: boolean,
  featuredInNewPost: boolean
}

const EditStageModal : m.Component<{
  description: string,
  id: number,
  name: string,
  featuredInSidebar: boolean,
  featuredInNewPost: boolean,
  defaultOffchainTemplate: string
}, {
  error: any,
  form: IEditStageModalForm,
  saving: boolean,
  quillEditorState,
}> = {
  view: (vnode) => {
    if (!app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, name, description, featuredInSidebar, featuredInNewPost, defaultOffchainTemplate } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, featuredInSidebar, featuredInNewPost };
    }

    const disabled = vnode.state.form.featuredInNewPost && vnode.state.quillEditorState?.editor?.editor?.isBlank();

    const updateStage = async (form) => {
      const { quillEditorState } = vnode.state;

      if (quillEditorState) {
        quillEditorState.editor.enable(false);
      }

      const mentionsEle = document.getElementsByClassName('ql-mention-list-container')[0];
      if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';
      const bodyText = !quillEditorState ? ''
        : quillEditorState.markdownMode
          ? quillEditorState.editor.getText()
          : JSON.stringify(quillEditorState.editor.getContents());
      const stageInfo = {
        id,
        description: form.description,
        name: form.name,
        communityId: app.activeCommunityId(),
        chainId: app.activeChainId(),
        featuredInSidebar: form.featuredInSidebar,
        featuredInNewPost: form.featuredInNewPost,
        defaultOffchainTemplate: bodyText
      };
      await app.stages.edit(stageInfo);
      // navigateToSubpage(`/discussions/${encodeURI(form.name.toString().trim())}`);
    };

    const deleteStage = async (form) => {
      const stageInfo = {
        id,
        name: form.name,
        communityId: app.activeCommunityId(),
        chainId: app.activeChainId(),
      };
      await app.stages.remove(stageInfo);
      navigateToSubpage('/');
    };

    return m('.EditStageModal', [
      m('.compact-modal-title', [
        m('h3', 'Edit stage'),
        m(CompactModalExitButton),
      ]),
      m('.compact-modal-body', [
        m(Form, [
          m(FormGroup, [
            m(FormLabel, { for: 'name' }, 'Name'),
            m(Input, {
              title: 'Name',
              name: 'name',
              autocomplete: 'off',
              oncreate: (vvnode) => {
                // use oncreate to focus because autofocus: true fails when component is recycled in a modal
                setTimeout(() => $(vvnode.dom).find('input').focus(), 0);
              },
              class: 'stage-form-name',
              tabindex: 1,
              defaultValue: vnode.state?.form?.name,
              oninput: (e) => {
                vnode.state.form.name = (e.target as any).value;
              },
            }),
          ]),
          m(FormGroup, [
            m(FormLabel, { for: 'description' }, 'Description'),
            m(Input, {
              title: 'Description',
              name: 'description',
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

                let newDraftMarkdown;
                let newDraftDelta;
                if (defaultOffchainTemplate) {
                  try {
                    newDraftDelta = JSON.parse(defaultOffchainTemplate);
                    if (!newDraftDelta.ops) throw new Error();
                  } catch (e) {
                    newDraftMarkdown = defaultOffchainTemplate;
                  }
                }
                // If the text format of the loaded draft differs from the current editor's mode,
                // we update the current editor's mode accordingly, to preserve formatting
                if (newDraftDelta && vnode.state.quillEditorState.markdownMode) {
                  vnode.state.quillEditorState.markdownMode = false;
                } else if (newDraftMarkdown && !vnode.state.quillEditorState.markdownMode) {
                  vnode.state.quillEditorState.markdownMode = true;
                }
                if (newDraftDelta) {
                  vnode.state.quillEditorState.editor.setContents(newDraftDelta);
                } else if (newDraftMarkdown) {
                  vnode.state.quillEditorState.editor.setText(newDraftMarkdown);
                } else {
                  vnode.state.quillEditorState.editor.setContents('');
                  vnode.state.quillEditorState.editor.setText('');
                }
                m.redraw();
              },
              editorNamespace: 'new-discussion',
              imageUploader: true,
              tabindex: 3,
            }),
          ]),
          m(FormGroup, [
            m(Button, {
              intent: 'primary',
              disabled: vnode.state.saving || disabled,
              style: 'margin-right: 8px',
              rounded: true,
              onclick: async (e) => {
                e.preventDefault();
                updateStage(vnode.state.form).then(() => {
                  $(e.target).trigger('modalexit');
                }).catch((err) => {
                  vnode.state.saving = false;
                  m.redraw();
                });
              },
              label: 'Save changes',
            }),
            m(Button, {
              intent: 'negative',
              disabled: vnode.state.saving,
              rounded: true,
              onclick: async (e) => {
                e.preventDefault();
                const confirmed = await confirmationModalWithText('Delete this stage?')();
                if (!confirmed) return;
                deleteStage(vnode.state.form).then(() => {
                  $(e.target).trigger('modalexit');
                  navigateToSubpage('/');
                }).catch((err) => {
                  vnode.state.saving = false;
                  m.redraw();
                });
              },
              label: 'Delete stage',
            }),
          ]),
        ]),
        vnode.state.error && m('.error-message', vnode.state.error),
      ])
    ]);
  }
};

export default EditStageModal;
