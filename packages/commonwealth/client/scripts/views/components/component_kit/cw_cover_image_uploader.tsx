/* @jsx m */
import 'components/component_kit/cw_cover_image_uploader.scss';

import m, { VnodeDOM } from 'mithril';
import $ from 'jquery';
import app from 'state';

import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { CWSpinner } from './cw_spinner';
import { getClasses } from './helpers';
import { MessageRow } from './cw_text_input';
import { ValidationStatus } from './cw_validation_text';

type ICWCoverImageUploaderAttrs = {
  headerText?: string;
  subheaderText?: string;
  uploadCompleteCallback: CallableFunction;
}

// TODO Graham 10/24/22: Synchronize avatar upload against new cover upload system
export default class CWCoverImageUploader
  implements m.ClassComponent<ICWCoverImageUploaderAttrs>
{
  private imageURL: string;
  private uploading: boolean;
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

  oncreate(vnode: VnodeDOM<ICWCoverImageUploaderAttrs, this>) {
    const attachZone = document.querySelector('.attach-zone') as HTMLElement;
    const attachButton = document.querySelector('.attach-btn') as HTMLElement;
    const pseudoInput = document.querySelector('#pseudo-input') as HTMLElement;

    // Drag'n'Drop helper function
    const handleDragEvent = (event, hoverAttachZone?: boolean) => {
      event.preventDefault();
      event.stopPropagation();
      attachZone.classList[hoverAttachZone ? 'add' : 'remove']('hovered');
    };

    const handleUpload = async (file: File) => {
      const [imageURL, uploadStatus] = await this.uploadImage(file);

      this.uploading = false;
      this.uploadStatus = uploadStatus;

      if (imageURL) {
        this.imageURL = imageURL;
        attachButton.style.display = 'none';
        vnode.attrs.uploadCompleteCallback(imageURL);
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
      delete this.uploadStatus;
      this.uploading = true;
      m.redraw();
      const { files } = dropEvent.dataTransfer;
      handleUpload(files[0]);
    };

    attachZone.addEventListener('dragenter', dragEnterHandler);
    attachZone.addEventListener('dragleave', dragLeaveHandler);
    attachZone.addEventListener('dragover', dragOverHandler);
    attachZone.addEventListener('drop', dropHandler);

    // On-click support
    const pseudoInputHandler = (inputEvent: InputEvent) => {
      this.uploading = true;
      m.redraw();
      handleUpload((inputEvent.target as HTMLInputElement).files[0]);
    };
    const clickHandler = () => {
      pseudoInput.click();
    };

    pseudoInput.addEventListener('change', pseudoInputHandler);
    attachZone.addEventListener('click', clickHandler);
  }

  view(vnode: VnodeDOM<ICWCoverImageUploaderAttrs, this>) {
    const { imageURL, uploadStatus } = this;
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
          class={getClasses<{ uploadStatus: ValidationStatus }>(
            {
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
          {this.uploading && <CWSpinner active="true" size="large" />}
          <div class="attach-btn">
            {!this.uploading && (
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
