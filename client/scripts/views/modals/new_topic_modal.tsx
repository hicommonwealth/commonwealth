/* @jsx m */

import m from 'mithril';
import app from 'state';
import $ from 'jquery';

import 'modals/new_topic_modal.scss';

import { ChainNetwork } from 'types';
import QuillEditor from 'views/components/quill_editor';
import { pluralizeWithoutNumberPrefix } from 'helpers';
import { CompactModalExitButton } from 'views/components/component_kit/cw_modal';
import { TokenDecimalInput } from 'views/components/token_decimal_input';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWButton } from '../components/component_kit/cw_button';

type NewTopicModalForm = {
  description: string;
  featuredInNewPost: boolean;
  featuredInSidebar: boolean;
  id: number;
  name: string;
  tokenThreshold: string;
};

export class NewTopicModal implements m.ClassComponent<NewTopicModalForm> {
  private error: string;
  private form: NewTopicModalForm = {
    description: '',
    featuredInNewPost: false,
    featuredInSidebar: false,
    id: undefined,
    name: '',
    tokenThreshold: '0',
  };
  private quillEditorState; // do we have a type for this?
  private saving: false;

  view() {
    let disabled = false;

    if (!this.form.name || !this.form.name.trim()) disabled = true;

    if (
      this.form.featuredInNewPost &&
      this.quillEditorState &&
      this.quillEditorState.editor &&
      this.quillEditorState.editor.editor.isBlank()
    ) {
      disabled = true;
    }

    const decimals = app.chain?.meta?.decimals
      ? app.chain.meta.decimals
      : app.chain.network === ChainNetwork.ERC721
      ? 0
      : 18;

    return (
      <div class="NewTopicModal">
        <div class="compact-modal-title">
          <h3>New topic</h3>
          <CompactModalExitButton />
        </div>
        <div class="compact-modal-body">
          <CWTextInput
            label="Name"
            name="name"
            defaultValue={this.form.name}
            oninput={(e) => {
              this.form.name = (e.target as HTMLInputElement).value;
            }}
            inputValidationFn={(text) => {
              let errorMsg;

              const currentCommunityTopicNames = app.chain.meta.topics.map(
                (t) => t.name.toLowerCase()
              );

              if (currentCommunityTopicNames.includes(text.toLowerCase())) {
                errorMsg = 'Topic name already used within community.';
                this.error = errorMsg;
                m.redraw();
                return ['failure', errorMsg];
              }

              const disallowedCharMatches = text.match(/["<>%{}|\\/^`]/g);

              if (disallowedCharMatches) {
                errorMsg = `The ${pluralizeWithoutNumberPrefix(
                  disallowedCharMatches.length,
                  'char'
                )} 
                ${disallowedCharMatches.join(', ')} are not permitted`;
                this.error = errorMsg;
                m.redraw();
                return ['failure', errorMsg];
              }

              if (this.error) delete this.error;

              return ['success', 'Valid topic name'];
            }}
            autofocus
            tabindex={1}
            oncreate={(vvnode) => {
              // use oncreate to focus because autofocus: true fails when component is recycled in a modal
              setTimeout(() => $(vvnode.dom).find('input').focus(), 0);
            }}
          />
          <CWTextInput
            label="Description"
            name="description"
            tabindex={2}
            defaultValue={this.form.description}
            oninput={(e) => {
              this.form.description = (e.target as any).value;
            }}
          />
          {app.activeChainId() && (
            <>
              <CWLabel
                label={`Number of tokens needed to post (${app.chain?.meta.symbol})`}
              />
              <TokenDecimalInput
                decimals={decimals}
                defaultValueInWei="0"
                onInputChange={(newValue: string) => {
                  this.form.tokenThreshold = newValue;
                }}
              />
            </>
          )}
          <div class="checkboxes">
            <CWCheckbox
              label="Featured in Sidebar"
              checked={this.form.featuredInSidebar}
              onchange={(e) => {
                this.form.featuredInSidebar = !this.form.featuredInSidebar;
              }}
            />
            <CWCheckbox
              label="Featured in New Post"
              checked={this.form.featuredInNewPost}
              onchange={(e) => {
                this.form.featuredInNewPost = !this.form.featuredInNewPost;
              }}
            />
          </div>
          {this.form.featuredInNewPost &&
            m(QuillEditor, {
              contentsDoc: '',
              oncreateBind: (state) => {
                this.quillEditorState = state;
              },
              editorNamespace: 'new-discussion',
              imageUploader: true,
              tabindex: 3,
            })}
          <CWButton
            label="Create topic"
            disabled={this.saving || this.error || disabled}
            onclick={async (e) => {
              e.preventDefault();
              const { quillEditorState, form } = this;

              if (quillEditorState) {
                quillEditorState.editor.enable(false);
              }

              const mentionsEle = document.getElementsByClassName(
                'ql-mention-list-container'
              )[0];

              if (mentionsEle)
                (mentionsEle as HTMLElement).style.visibility = 'hidden';

              const defaultOffchainTemplate = !quillEditorState
                ? ''
                : quillEditorState.markdownMode
                ? quillEditorState.editor.getText()
                : JSON.stringify(quillEditorState.editor.getContents());

              app.topics
                .add(
                  form.name,
                  form.description,
                  null,
                  form.featuredInSidebar,
                  form.featuredInNewPost,
                  this.form.tokenThreshold || '0',
                  defaultOffchainTemplate
                )
                .then(() => {
                  this.saving = false;
                  m.redraw();
                  $(e.target).trigger('modalexit');
                })
                .catch(() => {
                  this.error = 'Error creating topic';
                  this.saving = false;
                  m.redraw();
                });
            }}
          />
          {this.error && m('.error-message', this.error)}
        </div>
      </div>
    );
  }
}
