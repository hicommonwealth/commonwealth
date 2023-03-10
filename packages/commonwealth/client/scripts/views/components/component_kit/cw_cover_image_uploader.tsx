/* @jsx m */
import ClassComponent from 'class_component';
import 'components/component_kit/cw_cover_image_uploader.scss';
import $ from 'jquery';

import m from 'mithril';
import app from 'state';

import { CWIcon } from './cw_icons/cw_icon';
import { CWSpinner } from './cw_spinner';
import { CWText } from './cw_text';
import { CWRadioGroup } from './cw_radio_group';
import { getClasses } from './helpers';
import { CWTextInput, MessageRow } from './cw_text_input';
import type { ValidationStatus } from './cw_validation_text';
import { CWButton } from './cw_button';
import { CWIconButton } from './cw_icon_button';

type CoverImageUploaderAttrs = {
  headerText?: string;
  subheaderText?: string;
  enableGenerativeAI?: boolean;
  generatedImageCallback?: CallableFunction;
  defaultImageUrl?: string;
  defaultImageBehavior?: string;
  name?: string;
  uploadCompleteCallback: CallableFunction;
};

export enum ImageAs {
  Cover = 'cover',
  Background = 'background',
}

export enum ImageBehavior {
  Fill = 'cover',
  Tiled = 'repeat',
}

// TODO Graham 10/24/22: Synchronize avatar upload against new cover upload system
export default class CWCoverImageUploader extends ClassComponent<CoverImageUploaderAttrs> {
  private imageURL: string;
  private isUploading: boolean;
  private uploadStatus: ValidationStatus;
  private uploadStatusMessage: string;
  private imageBehavior: ImageBehavior;
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

  async generateImage(prompt: string, vnode: m.Vnode<CoverImageUploaderAttrs>) {
    const attachButton = document.querySelector('.attach-btn') as HTMLElement;

    try {
      const res = await $.post(`${app.serverUrl()}/generateImage`, {
        description: prompt,
        jwt: app.user.jwt,
      });

      if (this.isPrompting) {
        this.imageURL = res.result.imageUrl;
        if (!this.imageBehavior) this.imageBehavior = ImageBehavior.Fill;
        this.uploadStatus = 'success';
        this.uploadStatusMessage = 'Image upload succeeded.';
        attachButton.style.display = 'none';
        if (vnode.attrs.generatedImageCallback)
          vnode.attrs.generatedImageCallback(this.imageURL, this.imageBehavior);
        vnode.attrs.uploadCompleteCallback(this.imageURL, this.imageBehavior);
      }

      this.isUploading = false;
      this.isPrompting = false;
      this.isGenerating = false;
      m.redraw();

      return res.result.imageUrl;
    } catch (e) {
      this.uploadStatus = 'failure';
      this.uploadStatusMessage =
        'Image generator failed, try uploading an image.';
      this.isUploading = false;
      this.isPrompting = false;
      this.isGenerating = false;
      m.redraw();
    }
  }

  oncreate(vnode: m.Vnode<CoverImageUploaderAttrs>) {
    const attachZone = document.querySelector(
      `.attach-zone.${vnode.attrs.name}`
    ) as HTMLElement;
    const attachButton = document.querySelector(
      `.attach-btn.${vnode.attrs.name}`
    ) as HTMLElement;
    const pseudoInput = document.querySelector(
      `#pseudo-input-${vnode.attrs.name}`
    ) as HTMLElement;

    this.isPrompting = false;
    this.imageURL = vnode.attrs.defaultImageUrl;
    this.imageBehavior = vnode.attrs.defaultImageBehavior as ImageBehavior;

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
      m.redraw();

      const [imageURL, uploadStatus] = await this.uploadImage(file);
      this.isUploading = false;
      this.uploadStatus = uploadStatus;
      this.uploadStatusMessage =
        uploadStatus === 'success'
          ? 'Image upload succeeded.'
          : 'Image upload failed.';

      if (imageURL) {
        this.imageURL = imageURL;
        if (!this.imageBehavior) this.imageBehavior = ImageBehavior.Fill;
        attachButton.style.display = 'none';
        vnode.attrs.uploadCompleteCallback(this.imageURL, this.imageBehavior);
      }

      m.redraw();
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

  view(vnode: m.Vnode<CoverImageUploaderAttrs>) {
    const {
      imageURL,
      isUploading,
      uploadStatus,
      isPrompting,
      isGenerating,
      imageBehavior,
    } = this;
    const {
      name,
      headerText,
      subheaderText,
      enableGenerativeAI,
      uploadCompleteCallback,
    } = vnode.attrs;

    const isFillImage = imageBehavior === ImageBehavior.Fill;

    const backgroundStyles = {
      backgroundImage: imageURL ? `url(${imageURL})` : 'none',
      backgroundSize: isFillImage ? 'cover' : '100px',
      backgroundRepeat: isFillImage ? 'no-repeat' : 'repeat',
      backgroundPosition: isFillImage ? 'center' : '0 0',
    };

    return (
      <div class="CoverImageUploader">
        {headerText && (
          <CWText type="caption" fontWeight="medium">
            {headerText}
          </CWText>
        )}
        <MessageRow
          label={subheaderText || 'Accepts JPG and PNG files.'}
          hasFeedback={true}
          statusMessage={this.uploadStatusMessage}
          validationStatus={this.uploadStatus}
        />
        <div
          class={getClasses<{
            isUploading: boolean;
            uploadStatus: ValidationStatus;
          }>(
            {
              isUploading,
              uploadStatus,
            },
            `attach-zone ${name}`
          )}
          style={!isPrompting && !isGenerating && backgroundStyles}
        >
          {this.uploadStatus === 'success' && enableGenerativeAI && (
            <CWButton
              label="Regenerate"
              buttonType="mini-black"
              className="retry-button"
              onclick={(e) => {
                e.stopPropagation();
                this.prompt = '';
                this.isPrompting = true;
              }}
            />
          )}

          {isPrompting && (
            <div
              class="cover-image-overlay"
              onclick={(e) => e.stopPropagation()}
            >
              <div class="icon-button-wrapper">
                <CWIconButton
                  onclick={(e) => {
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
                    oninput={(e) => {
                      this.prompt = e.target.value;
                    }}
                    iconRight="trash"
                    iconRightonclick={() => {
                      this.prompt = '';
                    }}
                    containerClassName="prompt-input"
                  />
                  <CWButton
                    label="Generate"
                    buttonType="mini-black"
                    className="generate-btn"
                    onclick={async () => {
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
              id={`pseudo-input-${name}`}
              class="pseudo-input"
            />
          )}
          {this.isUploading && <CWSpinner active="true" size="large" />}
          <div class={`attach-btn ${name}`}>
            {!this.isUploading && (
              <CWIcon
                iconName="imageUpload"
                iconSize="large"
                iconButtonTheme="hasBackground"
              />
            )}
            <CWText type="caption" fontWeight="medium">
              {headerText}
            </CWText>
            {enableGenerativeAI && !this.isUploading && (
              <CWButton
                buttonType="mini-white"
                label="Generate image"
                className="generate-btn"
                onclick={(e) => {
                  this.prompt = '';
                  e.stopPropagation();
                  this.isPrompting = true;
                }}
              />
            )}
          </div>
        </div>
        <div className="options">
          <CWText
            type="caption"
            fontWeight="medium"
            className="cover-image-title"
          >
            Choose image behavior
          </CWText>
          <CWRadioGroup
            name="image-behaviour"
            onchange={(e) => {
              this.imageBehavior = e.target.value;
              uploadCompleteCallback(this.imageURL, this.imageBehavior);
            }}
            toggledOption={imageBehavior}
            options={[
              {
                label: 'Fill',
                value: ImageBehavior.Fill,
              },
              {
                label: 'Tile',
                value: ImageBehavior.Tiled,
              },
            ]}
          />
        </div>
      </div>
    );
  }
}
