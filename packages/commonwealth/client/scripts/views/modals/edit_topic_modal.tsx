import React from 'react';

import { ClassComponent, redraw} from

 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';
import $ from 'jquery';
import { pluralizeWithoutNumberPrefix } from 'helpers';
import { navigateToSubpage } from 'router';

import 'modals/edit_topic_modal.scss';
import { Topic } from 'models';

import app from 'state';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import type { QuillEditor } from '../components/quill/quill_editor';
import type { QuillTextContents } from '../components/quill/types';

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

export class EditTopicModal extends ClassComponent<EditTopicModalAttrs> {
  private error: string;
  private form: EditTopicModalForm;
  private quillEditorState: QuillEditor;
  private saving: boolean;
  private _contentsDoc: QuillTextContents;

  view(vnode: ResultNode<EditTopicModalAttrs>) {
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
        redraw();
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
      <div className="EditTopicModal">
        <div className="compact-modal-title">
          <h3>Edit topic</h3>
          <ModalExitButton />
        </div>
        <div className="compact-modal-body">
          <CWTextInput
            label="Name"
            value={this?.form?.name}
            onInput={(e) => {
              this.form.name = (e.target as HTMLInputElement).value;
            }}
            inputValidationFn={(text: string) => {
              let errorMsg;

              const disallowedCharMatches = text.match(/["<>%{}|\\/^`]/g);
              if (disallowedCharMatches) {
                errorMsg = `The ${pluralizeWithoutNumberPrefix(
                  disallowedCharMatches.length,
                  'char'
                )} 
                ${disallowedCharMatches.join(', ')} are not permitted`;
                this.error = errorMsg;
                redraw();
                return ['failure', errorMsg];
              }

              if (this.error) delete this.error;

              return ['success', 'Valid topic name'];
            }}
            tabIndex={1}
            // oncreate={(vvnode) => {
            //   // use oncreate to focus because autoFocus: true fails when component is recycled in a modal
            //   setTimeout(() => $(vvnode.dom).find('input').focus(), 0);
            // }}
          />
          <CWTextInput
            label="Description"
            name="description"
            tabIndex={2}
            value={this.form.description}
            onInput={(e) => {
              this.form.description = (e.target as HTMLInputElement).value;
            }}
          />
          <CWCheckbox
            label="Featured in Sidebar"
            checked={this.form.featuredInSidebar}
            onChange={() => {
              this.form.featuredInSidebar = !this.form.featuredInSidebar;
            }}
            value=""
          />
          <CWCheckbox
            label="Featured in New Post"
            checked={this.form.featuredInNewPost}
            onChange={() => {
              this.form.featuredInNewPost = !this.form.featuredInNewPost;
            }}
            value=""
          />
          {this.form.featuredInNewPost && (
            <QuillEditorComponent
              contentsDoc={this._contentsDoc}
              oncreateBind={(state: QuillEditor) => {
                this.quillEditorState = state;
              }}
              editorNamespace="new-discussion"
              tabIndex={3}
            />
          )}
          <div className="buttons-row">
            <CWButton
              onClick={async (e) => {
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
                    redraw();
                  });
              }}
              label="Save changes"
            />
            <CWButton
              buttonType="primary-red"
              disabled={this.saving}
              onClick={async (e) => {
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
                    redraw();
                  });
              }}
              label="Delete topic"
            />
          </div>
          {this.error && (
            <CWValidationText message={this.error} status="failure" />
          )}
        </div>
      </div>
    );
  }
}
