/* @jsx jsx */
import React from 'react';
import 'components/component_kit/cw_cover_image_uploader.scss';
import $ from 'jquery';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import app from 'state';

import { CWIcon } from './cw_icons/cw_icon';
import { CWSpinner } from './cw_spinner';
import { getClasses } from './helpers';
import { CWTextInput, MessageRow } from './cw_text_input';
import type { ValidationStatus } from './cw_validation_text';
import { CWButton } from './cw_button';
import { CWIconButton } from './cw_icon_button';
import { CWText } from './cw_text';

type CoverImageUploaderAttrs = {
  headerText?: string;
  subheaderText?: string;
  enableGenerativeAI?: boolean;
  generatedImageCallback?: CallableFunction;
  uploadCompleteCallback: CallableFunction;
};

// TODO Graham 10/24/22: Synchronize avatar upload against new cover upload system
export default class CWCoverImageUploader extends ClassComponent<CoverImageUploaderAttrs> {
  private imageURL: string;
  private isUploading: boolean;
  private uploadStatus: ValidationStatus;
  private prompt: string;
  private isPrompting: boolean;
  private isGenerating: boolean;

  async uploadImage(file: File): Promise<[string, ValidationStatus]> {
    try {
      const signatureResponse = await $.post(
        `${app.serverUrl()}/getUploadSignature`,
        {
          name: file.name,
          mimetype: file.type,
          auth: true,
          jwt: app.user.jwt,
        }
      );
      if (signatureResponse.status !== 'Success') throw new Error();

      const uploadURL = signatureResponse.result;
      const uploadResponse = await fetch(uploadURL, {
        method: 'put',
        body: file,
      });

      const imageURL = uploadResponse.url?.replace(/\?.*/, '').trim();
      if (!imageURL) throw new Error();

      return [imageURL, 'success'];
    } catch (e) {
      return [null, 'failure'];
    }
  }

  async generateImage(
    prompt: string,
    vnode: ResultNode<CoverImageUploaderAttrs>
  ) {
    const attachButton = document.querySelector('.attach-btn') as HTMLElement;

    try {
      const res = await $.post(`${app.serverUrl()}/generateImage`, {
        description: prompt,
        jwt: app.user.jwt,
      });

      if (this.isPrompting) {
        this.imageURL = res.result.imageUrl;
        this.uploadStatus = 'success';
        attachButton.style.display = 'none';
        if (vnode.attrs.generatedImageCallback)
          vnode.attrs.generatedImageCallback(this.imageURL);
        vnode.attrs.uploadCompleteCallback(this.imageURL);
      }

      this.isUploading = false;
      this.isPrompting = false;
      this.isGenerating = false;
      redraw();

      return res.result.imageUrl;
    } catch (e) {
      this.uploadStatus = 'failure';
      this.isUploading = false;
      this.isPrompting = false;
      this.isGenerating = false;
      throw new Error(e);
    }
  }

  oncreate(vnode: ResultNode<CoverImageUploaderAttrs>) {
    const attachZone = document.querySelector('.attach-zone') as HTMLElement;
    const attachButton = document.querySelector('.attach-btn') as HTMLElement;
    const pseudoInput = document.querySelector('#pseudo-input') as HTMLElement;

    this.isPrompting = false;

    // Drag'n'Drop helper function
    const handleDragEvent = (event, hoverAttachZone?: boolean) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.isUploading) return;
      attachZone.classList[hoverAttachZone ? 'add' : 'remove']('hovered');
    };

    const handleUpload = async (file: File) => {
      if (!file) return;
      this.isUploading = true;
      this.redraw();

      const [imageURL, uploadStatus] = await this.uploadImage(file);
      this.isUploading = false;
      this.uploadStatus = uploadStatus;

      if (imageURL) {
        this.imageURL = imageURL;
        attachButton.style.display = 'none';
        vnode.attrs.uploadCompleteCallback(imageURL);
      }

      this.redraw();
    };

    // Drag'n'Drop event handler declarations
    const dragEnterHandler = (enterEvent: DragEvent) => {
      handleDragEvent(enterEvent, true);
    };

    const dragOverHandler = (overEvent: DragEvent) => {
      handleDragEvent(overEvent, true);
    };

    const dragLeaveHandler = (leaveEvent: DragEvent) => {
      handleDragEvent(leaveEvent, false);
    };

    const dropHandler = (dropEvent: DragEvent) => {
      handleDragEvent(dropEvent, false);
      if (this.isUploading) return;
      delete this.uploadStatus;
      const { files } = dropEvent.dataTransfer;
      handleUpload(files[0]);
    };

    attachZone.addEventListener('dragenter', dragEnterHandler);
    attachZone.addEventListener('dragleave', dragLeaveHandler);
    attachZone.addEventListener('dragover', dragOverHandler);
    attachZone.addEventListener('drop', dropHandler);

    // On-click support
    const pseudoInputHandler = (inputEvent: InputEvent) => {
      handleUpload((inputEvent.target as HTMLInputElement).files[0]);
    };
    const clickHandler = () => {
      if (this.isUploading) return;
      pseudoInput.click();
    };

    pseudoInput.addEventListener('change', pseudoInputHandler);
    attachZone.addEventListener('click', clickHandler);
  }

  view(vnode: ResultNode<CoverImageUploaderAttrs>) {
    const {
      imageURL,
      isUploading,
      uploadStatus,
      prompt,
      isPrompting,
      isGenerating,
    } = this;
    const {
      headerText,
      subheaderText,
      enableGenerativeAI,
      generatedImageCallback,
    } = vnode.attrs;

    return (
      <div className="CoverImageUploader">
        {headerText && (
          <CWText type="caption" fontWeight="medium">
            {headerText}
          </CWText>
        )}
        <MessageRow
          label={subheaderText || 'Accepts JPG and PNG files.'}
          hasFeedback={true}
          statusMessage={
            this.uploadStatus === 'success'
              ? 'Image upload succeeded.'
              : this.uploadStatus === 'failure'
              ? 'Image upload failed.'
              : null
          }
          validationStatus={this.uploadStatus}
        />
        <div
          className={getClasses<{
            isUploading: boolean;
            uploadStatus: ValidationStatus;
          }>(
            {
              isUploading,
              uploadStatus,
            },
            'attach-zone'
          )}
          style={{ backgroundImage: `url(${imageURL})` }}
        >
          {this.uploadStatus === 'success' && enableGenerativeAI && (
            <CWButton
              label="retry"
              buttonType="mini-black"
              className="retry-button"
              onClick={(e) => {
                e.stopPropagation();
                this.prompt = '';
                this.isPrompting = true;
              }}
            />
          )}

          {isPrompting && (
            <div
              className="cover-image-overlay"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="icon-button-wrapper">
                <CWIconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    this.isPrompting = false;
                    this.isGenerating = false;
                  }}
                  iconName="close"
                  iconSize="small"
                />
              </div>
              {this.isGenerating ? (
                <CWSpinner size="large" />
              ) : (
                <>
                  <CWTextInput
                    label="Prompt"
                    size="small"
                    value={this.prompt}
                    placeholder="type a description here"
                    onInput={(e) => {
                      this.prompt = e.target.value;
                    }}
                    iconRight="trash"
                    iconRightonClick={() => {
                      this.prompt = '';
                    }}
                    containerClassName="prompt-input"
                  />
                  <CWButton
                    label="Generate"
                    buttonType="mini-black"
                    className="generate-btn"
                    onClick={async () => {
                      if (this.prompt.length < 1) return;
                      this.isGenerating = true;
                      try {
                        await this.generateImage(this.prompt, vnode);
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  />
                </>
              )}
            </div>
          )}
          {!isPrompting && (
            <input
              type="file"
              accept="image/jpeg, image/jpg, image/png"
              id="pseudo-input"
              className="pseudo-input"
            />
          )}
          {this.isUploading && <CWSpinner size="large" />}
          <div className="attach-btn">
            {!this.isUploading && (
              <CWIcon iconName="imageUpload" iconSize="medium" />
            )}
            <CWText type="caption" fontWeight="medium">
              Drag or upload your image here
            </CWText>
            {enableGenerativeAI && !this.isUploading && (
              <CWButton
                buttonType="mini-white"
                label="Generate Image"
                className="generate-btn"
                onClick={(e) => {
                  this.prompt = '';
                  e.stopPropagation();
                  this.isPrompting = true;
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}
