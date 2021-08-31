import 'modals/edit_topic_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, FormLabel, Checkbox } from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import QuillEditor from 'views/components/quill_editor';
import { CompactModalExitButton } from 'views/modal';

interface IEditTopicModalForm {
  description: string,
  id: number,
  name: string,
  featuredInSidebar: boolean,
  featuredInNewPost: boolean
}

const EditTopicModal : m.Component<{
  description: string,
  id: number,
  name: string,
  featuredInSidebar: boolean,
  featuredInNewPost: boolean,
  defaultOffchainTemplate: string
}, {
  error: any,
  form: IEditTopicModalForm,
  saving: boolean,
  quillEditorState,
}> = {
  view: (vnode) => {
    if (!app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return null;
    const { id, name, description, featuredInSidebar, featuredInNewPost, defaultOffchainTemplate } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = { id, name, description, featuredInSidebar, featuredInNewPost };
    }

    const updateTopic = async (form) => {
      const { quillEditorState } = vnode.state;
      if (form.featuredInNewPost && quillEditorState.editor.editor.isBlank()) {
        vnode.state.error = 'Must provide template.';
        throw new Error('Must provide template.');
      }

      if (quillEditorState) {
        quillEditorState.editor.enable(false);
      }

      const mentionsEle = document.getElementsByClassName('ql-mention-list-container')[0];
      if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';
      const bodyText = !quillEditorState ? ''
        : quillEditorState.markdownMode
          ? quillEditorState.editor.getText()
          : JSON.stringify(quillEditorState.editor.getContents());
      const topicInfo = {
        id,
        description: form.description,
        name: form.name,
        communityId: app.activeCommunityId(),
        chainId: app.activeChainId(),
        telegram: null,
        featuredInSidebar: form.featuredInSidebar,
        featuredInNewPost: form.featuredInNewPost,
        defaultOffchainTemplate: bodyText
      };
      await app.topics.edit(topicInfo);
      navigateToSubpage(`/discussions/${encodeURI(form.name.toString().trim())}`);
      return true;
    };

    const deleteTopic = async (form) => {
      const topicInfo = {
        id,
        name: form.name,
        communityId: app.activeCommunityId(),
        chainId: app.activeChainId(),
      };
      await app.topics.remove(topicInfo);
      navigateToSubpage('/');
    };

    return m('.EditTopicModal', [
      m('.compact-modal-title', [
        m('h3', 'Edit topic'),
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
              class: 'topic-form-name',
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
              disabled: vnode.state.saving,
              style: 'margin-right: 8px',
              rounded: true,
              onclick: async (e) => {
                e.preventDefault();
                updateTopic(vnode.state.form).then(() => {
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
                const confirmed = await confirmationModalWithText('Delete this topic?')();
                if (!confirmed) return;
                deleteTopic(vnode.state.form).then(() => {
                  $(e.target).trigger('modalexit');
                  navigateToSubpage('/');
                }).catch((err) => {
                  vnode.state.saving = false;
                  m.redraw();
                });
              },
              label: 'Delete topic',
            }),
          ]),
        ]),
        vnode.state.error && m('.error-message', vnode.state.error),
      ])
    ]);
  }
};

export default EditTopicModal;
