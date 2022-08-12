/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'modals/edit_topic_modal.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { Topic } from 'models';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWButton } from '../components/component_kit/cw_button';
import { QuillEditor } from '../components/quill/quill_editor';
import { QuillTextContents } from '../components/quill/types';

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
  private quillEditorState: QuillEditor;
  private saving: boolean;
  private _contentsDoc: QuillTextContents;

  view(vnode) {
    const {
      defaultOffchainTemplate,
      description,
      featuredInNewPost,
      featuredInSidebar,
      id,
      name,
    } = vnode.attrs;

    if (defaultOffchainTemplate) {
      try {
        this._contentsDoc = JSON.parse(defaultOffchainTemplate);
      } catch (e) {
        this._contentsDoc = defaultOffchainTemplate;
      }
    }

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
      if (form.featuredInNewPost) {
        if (!this.quillEditorState || this.quillEditorState?.isBlank()) {
          this.error = 'Must provide template.';
          return false;
        } else {
          this.quillEditorState?.disable();
        }
      }

      const topicInfo = {
        id,
        description: form.description,
        name: form.name,
        chain_id: app.activeChainId(),
        telegram: null,
        featured_in_sidebar: form.featuredInSidebar,
        featured_in_new_post: form.featuredInNewPost,
        default_offchain_template: form.featuredInNewPost
          ? this.quillEditorState.textContentsAsString
          : null,
      };

      try {
        await app.topics.edit(new Topic(topicInfo));
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
          {this.form.featuredInNewPost && (
            <QuillEditorComponent
              contentsDoc={this._contentsDoc}
              oncreateBind={(state: QuillEditor) => {
                this.quillEditorState = state;
              }}
              editorNamespace="new-discussion"
              tabindex={3}
            />
          )}
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
