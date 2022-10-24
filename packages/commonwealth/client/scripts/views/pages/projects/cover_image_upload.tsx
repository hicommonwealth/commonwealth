/* @jsx m */
import 'pages/projects/cover_image_upload.scss';

import m, { VnodeDOM } from 'mithril';
import $ from 'jquery';
import app from 'state';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { Spinner } from 'construct-ui';
import { CWText } from 'views/components/component_kit/cw_text';
import { notifyError, notifySuccess } from 'controllers/app/notifications';

interface ICoverImageUploadAttrs {
  uploadCompleteCallback: CallableFunction;
}

// TODO Graham 6/21/22: Consider syncing down the line w/ new Avatar upload
export default class CoverImageUpload
  implements m.ClassComponent<ICoverImageUploadAttrs>
{
  private uploading: boolean;

  async uploadImage(file: File) {
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

      notifySuccess('Image successfully uploaded');
      return imageURL;
    } catch (e) {
      notifyError('Image failed to upload');
    }
  }

  oncreate(vnode: VnodeDOM<ICoverImageUploadAttrs, this>) {
    console.log(vnode.attrs);
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
      const imageURL = await this.uploadImage(file);
      this.uploading = false;
      attachZone.style.backgroundImage = `url(${imageURL})`;
      attachButton.style.display = 'none';
      vnode.attrs.uploadCompleteCallback(imageURL);
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
    const clickHandler = (clickEvent: MouseEvent) => {
      clickEvent.preventDefault();
      pseudoInput.click();
    };
    attachZone.addEventListener('click', clickHandler);
  }

  view() {
    return (
      <div class="CoverImageUpload">
        <div class="attach-zone">
          <input type="file" id="pseudo-input" />
          {this.uploading && <Spinner active="true" size="lg" />}
          <div class="attach-btn">
            {!this.uploading && <CWIcon iconName="plus" iconSize="large" />}
            <CWText type="h5">Upload Cover Image</CWText>
            <CWText type="caption">1040px by 568px</CWText>
          </div>
        </div>
      </div>
    );
  }
}
