/* @jsx jsx */
import 'components/component_kit/cw_cover_image_uploader.scss';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import $ from 'jquery';
import app from 'state';

import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { CWSpinner } from './cw_spinner';
import { getClasses } from './helpers';
import { MessageRow } from './cw_text_input';
import { ValidationStatus } from './cw_validation_text';

type CoverImageUploaderAttrs = {
  headerText?: string;
  subheaderText?: string;
  uploadCompleteCallback: CallableFunction;
};

// TODO Graham 10/24/22: Synchronize avatar upload against new cover upload system
export default class CWCoverImageUploader extends ClassComponent<CoverImageUploaderAttrs> {
  private imageURL: string;
  private isUploading: boolean;
  private uploadStatus: ValidationStatus;

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

  oncreate(vnode: ResultNode<CoverImageUploaderAttrs>) {
    const attachZone = document.querySelector('.attach-zone') as HTMLElement;
    const attachButton = document.querySelector('.attach-btn') as HTMLElement;
    const pseudoInput = document.querySelector('#pseudo-input') as HTMLElement;

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
      redraw();

      const [imageURL, uploadStatus] = await this.uploadImage(file);
      this.isUploading = false;
      this.uploadStatus = uploadStatus;

      if (imageURL) {
        this.imageURL = imageURL;
        attachButton.style.display = 'none';
        vnode.attrs.uploadCompleteCallback(imageURL);
      }

      redraw();
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
    const { imageURL, isUploading, uploadStatus } = this;
    const { headerText, subheaderText } = vnode.attrs;

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
          class={getClasses<{
            isUploading: boolean;
            uploadStatus: ValidationStatus;
          }>(
            {
              isUploading,
              uploadStatus,
            },
            'attach-zone'
          )}
          style={`background-image: url(${imageURL})`}
        >
          <input
            type="file"
            accept="image/jpeg, image/jpg, image/png"
            id="pseudo-input"
          />
          {this.isUploading && <CWSpinner active="true" size="large" />}
          <div class="attach-btn">
            {!this.isUploading && (
              <CWIcon iconName="imageUpload" iconSize="medium" />
            )}
            <CWText type="caption" fontWeight="medium">
              Drag or upload your image here
            </CWText>
          </div>
        </div>
      </div>
    );
  }
}
