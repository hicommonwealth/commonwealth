import 'modals/edit_topic_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import {
  Button,
  Input,
  Form,
  FormGroup,
  FormLabel,
  Checkbox,
} from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';
import { OffchainTopic } from 'models';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import QuillEditor from 'views/components/quill/quill_editor';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import {
  disableEditor,
  editorIsBlank,
  getQuillTextContents,
} from '../components/quill/helpers';

interface IEditTopicModalForm {
  description: string;
  id: number;
  name: string;
  featuredInSidebar: boolean;
  featuredInNewPost: boolean;
}

const EditTopicModal: m.Component<
  {
    description: string;
    id: number;
    name: string;
    featuredInSidebar: boolean;
    featuredInNewPost: boolean;
    defaultOffchainTemplate: string;
  },
  {
    error: any;
    form: IEditTopicModalForm;
    saving: boolean;
    quillEditorState;
  }
> = {
  view: (vnode) => {
    if (!app.user.isAdminOfEntity({ chain: app.activeChainId() })) return null;
    const {
      id,
      name,
      description,
      featuredInSidebar,
      featuredInNewPost,
      defaultOffchainTemplate,
    } = vnode.attrs;
    if (!vnode.state.form) {
      vnode.state.form = {
        id,
        name,
        description,
        featuredInSidebar,
        featuredInNewPost,
      };
    }

    const updateTopic = async (form) => {
      const { quillEditorState } = vnode.state;
      if (form.featuredInNewPost && editorIsBlank(quillEditorState)) {
        vnode.state.error = 'Must provide template.';
        return false;
      }

      disableEditor(quillEditorState);

      const bodyText = getQuillTextContents(quillEditorState);
      const topicInfo = {
        id,
        description: form.description,
        name: form.name,
        chain_id: app.activeChainId(),
        telegram: null,
        featured_in_sidebar: form.featuredInSidebar,
        featured_in_new_post: form.featuredInNewPost,
        default_offchain_template: bodyText,
      };
      try {
        await app.topics.edit(new OffchainTopic(topicInfo));
        return true;
      } catch (err) {
        vnode.state.error = err.message || err;
        m.redraw();
        return false;
      }
    };

    const deleteTopic = async (form) => {
      const topicInfo = {
        id,
        name: form.name,
        chainId: app.activeChainId(),
      };
      await app.topics.remove(topicInfo);
      navigateToSubpage('/');
    };

    return m('.EditTopicModal', [
      m('.compact-modal-title', [m('h3', 'Edit topic'), m(ModalExitButton)]),
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
                vnode.state.form.name = (e.target as HTMLInputElement).value;
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
                vnode.state.form.description = (
                  e.target as HTMLInputElement
                ).value;
              },
            }),
          ]),
          m(FormGroup, [
            m(Checkbox, {
              label: 'Featured in Sidebar',
              checked: vnode.state.form.featuredInSidebar,
              onchange: (e) => {
                vnode.state.form.featuredInSidebar =
                  !vnode.state.form.featuredInSidebar;
              },
            }),
          ]),
          m(FormGroup, [
            m(Checkbox, {
              label: 'Featured in New Post',
              checked: vnode.state.form.featuredInNewPost,
              onchange: (e) => {
                vnode.state.form.featuredInNewPost =
                  !vnode.state.form.featuredInNewPost;
              },
            }),
          ]),
          vnode.state.form.featuredInNewPost &&
            m(FormGroup, [
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
                  if (
                    newDraftDelta &&
                    vnode.state.quillEditorState.markdownMode
                  ) {
                    vnode.state.quillEditorState.markdownMode = false;
                  } else if (
                    newDraftMarkdown &&
                    !vnode.state.quillEditorState.markdownMode
                  ) {
                    vnode.state.quillEditorState.markdownMode = true;
                  }
                  if (newDraftDelta) {
                    vnode.state.quillEditorState.editor.setContents(
                      newDraftDelta
                    );
                  } else if (newDraftMarkdown) {
                    vnode.state.quillEditorState.editor.setText(
                      newDraftMarkdown
                    );
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
              // disabled: vnode.state.saving || !(vnode.state.form?.name),
              style: 'margin-right: 8px',
              rounded: true,
              onclick: async (e) => {
                e.preventDefault();
                const { form } = vnode.state;
                updateTopic(form)
                  .then((closeModal) => {
                    if (closeModal) {
                      $(e.target).trigger('modalexit');
                      navigateToSubpage(
                        `/discussions/${encodeURI(form.name.toString().trim())}`
                      );
                    }
                  })
                  .catch((err) => {
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
                const confirmed = await confirmationModalWithText(
                  'Delete this topic?'
                )();
                if (!confirmed) return;
                deleteTopic(vnode.state.form)
                  .then((closeModal) => {
                    $(e.target).trigger('modalexit');
                    navigateToSubpage('/');
                  })
                  .catch((err) => {
                    vnode.state.saving = false;
                    m.redraw();
                  });
              },
              label: 'Delete topic',
            }),
          ]),
        ]),
        vnode.state.error &&
          m(CWValidationText, {
            message: vnode.state.error,
            status: 'failure',
          }),
      ]),
    ]);
  },
};

export default EditTopicModal;
