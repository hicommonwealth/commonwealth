/* @jsx jsx */
import React from 'react';

import { ClassComponent, redraw, jsx } from 'mithrilInterop';

import { ChainBase, ChainNetwork } from 'common-common/src/types';

import { pluralizeWithoutNumberPrefix } from 'helpers';
import $ from 'jquery';

import 'modals/new_topic_modal.scss';
import app from 'state';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import type { QuillEditor } from 'views/components/quill/quill_editor';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { TokenDecimalInput } from 'views/components/token_decimal_input';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCheckbox } from '../components/component_kit/cw_checkbox';
import { CWLabel } from '../components/component_kit/cw_label';
import { CWValidationText } from '../components/component_kit/cw_validation_text';

type NewTopicModalForm = {
  description: string;
  featuredInNewPost: boolean;
  featuredInSidebar: boolean;
  id: number;
  name: string;
  tokenThreshold: string;
};

export class NewTopicModal extends ClassComponent {
  private error: string;
  private form: NewTopicModalForm = {
    description: '',
    featuredInNewPost: false,
    featuredInSidebar: false,
    id: undefined,
    name: '',
    tokenThreshold: '0',
  };
  private quillEditorState: QuillEditor;
  private saving: boolean;

  view() {
    let disabled = false;

    if (!this.form.name || !this.form.name.trim()) disabled = true;

    if (
      this.form.featuredInNewPost &&
      this.quillEditorState &&
      this.quillEditorState.isBlank()
    ) {
      disabled = true;
    }

    const decimals = getDecimals(app.chain);

    return (
      <div className="NewTopicModal">
        <div className="compact-modal-title">
          <h3>New topic</h3>
          <ModalExitButton />
        </div>
        <div className="compact-modal-body">
          <CWTextInput
            label="Name"
            value={this.form.name}
            onInput={(e) => {
              this.form.name = (e.target as HTMLInputElement).value;
            }}
            inputValidationFn={(text: string) => {
              let errorMsg;

              const currentCommunityTopicNames = app.topics
                .getByCommunity(app.activeChainId())
                .map((t) => t.name.toLowerCase());

              if (currentCommunityTopicNames.includes(text.toLowerCase())) {
                errorMsg = 'Topic name already used within community.';
                this.error = errorMsg;
                redraw();
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
                redraw();
                return ['failure', errorMsg];
              }

              if (this.error) delete this.error;

              return ['success', 'Valid topic name'];
            }}
            autoFocus
            autoComplete="off"
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
              this.form.description = (e.target as any).value;
            }}
          />
          {app.activeChainId() && (
            <React.Fragment>
              <CWLabel
                label={`Number of tokens needed to post (${app.chain?.meta.default_symbol})`}
              />
              <TokenDecimalInput
                decimals={decimals}
                defaultValueInWei="0"
                onInputChange={(newValue: string) => {
                  this.form.tokenThreshold = newValue;
                }}
              />
            </React.Fragment>
          )}
          <div className="checkboxes">
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
          </div>
          {this.form.featuredInNewPost && (
            <QuillEditorComponent
              contentsDoc=""
              oncreateBind={(state: QuillEditor) => {
                this.quillEditorState = state;
              }}
              editorNamespace="new-discussion"
              tabIndex={3}
            />
          )}
          <CWButton
            label="Create topic"
            disabled={this.saving || !!this.error || disabled}
            onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              const { form } = this;
              try {
                let defaultOffchainTemplate;
                if (this.quillEditorState) {
                  this.quillEditorState.disable();
                  defaultOffchainTemplate = this.quillEditorState
                    .textContentsAsString;
                }
                await app.topics.add(
                  form.name,
                  form.description,
                  null,
                  form.featuredInSidebar,
                  form.featuredInNewPost,
                  this.form.tokenThreshold || '0',
                  defaultOffchainTemplate as string
                );

                this.saving = false;
                redraw();
                $(e.target).trigger('modalexit');
              } catch (err) {
                this.error = 'Error creating topic';
                this.saving = false;
                if (this.quillEditorState) {
                  this.quillEditorState.enable();
                }
                redraw();
              }
            }}
          />
          {this.error && (
            <CWValidationText message={this.error} status="failure" />
          )}{' '}
        </div>
      </div>
    );
  }
}
