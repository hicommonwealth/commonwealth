/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'modals/edit_topic_modal.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { OffchainTopic } from 'models';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import QuillEditor from 'views/components/quill_editor';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWButton } from '../components/component_kit/cw_button';

type EditTopicModalAttrs = {
  defaultOffchainTemplate: string;
  description: string;
  featuredInNewPost: boolean;
  featuredInSidebar: boolean;
  id: number;
  name: string;
};

type EditTopicModalForm = {
  description: string;
  featuredInNewPost: boolean;
  featuredInSidebar: boolean;
  id: number;
  name: string;
};

export class EditTopicModal implements m.ClassComponent<EditTopicModalAttrs> {
  private error: string;
  private form: EditTopicModalForm;
  private quillEditorState; // do we have a type for this?
  private saving: boolean;

  view(vnode) {
    const {
      defaultOffchainTemplate,
      description,
      featuredInNewPost,
      featuredInSidebar,
      id,
      name,
    } = vnode.attrs;

    if (!this.form) {
      this.form = {
        description,
        featuredInNewPost,
        featuredInSidebar,
        id,
        name,
      };
    }

    const updateTopic = async (form) => {
      const { quillEditorState } = this;

      if (form.featuredInNewPost && quillEditorState.editor.editor.isBlank()) {
        this.error = 'Must provide template.';
        return false;
      }

      if (quillEditorState) {
        quillEditorState.editor.enable(false);
      }

      const mentionsEle = document.getElementsByClassName(
        'ql-mention-list-container'
      )[0];

      if (mentionsEle) (mentionsEle as HTMLElement).style.visibility = 'hidden';

      const bodyText = !quillEditorState
        ? ''
        : quillEditorState.markdownMode
        ? quillEditorState.editor.getText()
        : JSON.stringify(quillEditorState.editor.getContents());

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
        this.error = err.message || err;
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

    return (
      <div class="EditTopicModal">
        <div class="compact-modal-title">
          <h3>Edit topic</h3>
          <ModalExitButton />
        </div>
        <div class="compact-modal-body">
          <CWTextInput
            label="Name"
            name="name"
            oncreate={(vvnode) => {
              // use oncreate to focus because autofocus: true fails when component is recycled in a modal
              setTimeout(() => $(vvnode.dom).find('input').focus(), 0);
            }}
            tabindex={1}
            defaultValue={this?.form?.name}
            oninput={(e) => {
              this.form.name = (e.target as HTMLInputElement).value;
            }}
          />
          <CWTextInput
            label="Description"
            name="description"
            tabindex={2}
            defaultValue={this.form.description}
            oninput={(e) => {
              this.form.description = (e.target as HTMLInputElement).value;
            }}
          />
          <CWCheckbox
            label="Featured in Sidebar"
            checked={this.form.featuredInSidebar}
            onchange={() => {
              this.form.featuredInSidebar = !this.form.featuredInSidebar;
            }}
          />
          <CWCheckbox
            label="Featured in New Post"
            checked={this.form.featuredInNewPost}
            onchange={() => {
              this.form.featuredInNewPost = !this.form.featuredInNewPost;
            }}
          />
          {this.form.featuredInNewPost &&
            m(QuillEditor, {
              contentsDoc: '',
              oncreateBind: (state) => {
                this.quillEditorState = state;

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
                if (newDraftDelta && this.quillEditorState.markdownMode) {
                  this.quillEditorState.markdownMode = false;
                } else if (
                  newDraftMarkdown &&
                  !this.quillEditorState.markdownMode
                ) {
                  this.quillEditorState.markdownMode = true;
                }
                if (newDraftDelta) {
                  this.quillEditorState.editor.setContents(newDraftDelta);
                } else if (newDraftMarkdown) {
                  this.quillEditorState.editor.setText(newDraftMarkdown);
                } else {
                  this.quillEditorState.editor.setContents('');
                  this.quillEditorState.editor.setText('');
                }
                m.redraw();
              },
              editorNamespace: 'new-discussion',
              imageUploader: true,
              tabindex: 3,
            })}
          <CWButton
            onclick={async (e) => {
              e.preventDefault();
              const { form } = this;
              updateTopic(form)
                .then((closeModal) => {
                  if (closeModal) {
                    $(e.target).trigger('modalexit');
                    navigateToSubpage(
                      `/discussions/${encodeURI(form.name.toString().trim())}`
                    );
                  }
                })
                .catch(() => {
                  this.saving = false;
                  m.redraw();
                });
            }}
            label="Save changes"
          />
          <CWButton
            buttonType="primary-red"
            disabled={this.saving}
            onclick={async (e) => {
              e.preventDefault();
              const confirmed = await confirmationModalWithText(
                'Delete this topic?'
              )();
              if (!confirmed) return;
              deleteTopic(this.form)
                .then(() => {
                  $(e.target).trigger('modalexit');
                  navigateToSubpage('/');
                })
                .catch(() => {
                  this.saving = false;
                  m.redraw();
                });
            }}
            label="Delete topic"
          />
        </div>
        {this.error && (
          <CWValidationText message={this.error} status="failure" />
        )}
      </div>
    );
  }
}
