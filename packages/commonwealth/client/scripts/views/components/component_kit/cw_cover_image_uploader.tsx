/* @jsx jsx */
import React from 'react';
import 'components/component_kit/cw_cover_image_uploader.scss';

import { jsx } from 'mithrilInterop';
import $ from 'jquery';
import app from 'state';

import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { CWSpinner } from './cw_spinner';
import { getClasses } from './helpers';
import { MessageRow } from './cw_text_input';
import { ValidationStatus } from './cw_validation_text';

const uploadImage = async (file: File): Promise<[string, ValidationStatus]> => {
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
};

type CoverImageUploaderProps = {
  headerText?: string;
  subheaderText?: string;
  uploadCompleteCallback: CallableFunction;
};

// TODO Graham 10/24/22: Synchronize avatar upload against new cover upload system
export const CWCoverImageUploader = (props: CoverImageUploaderProps) => {
  const [imageURL, setImageURL] = React.useState<string>();
  const [isUploading, setIsUploading] = React.useState<boolean>();
  const [uploadStatus, setUploadStatus] = React.useState<
    ValidationStatus | undefined
  >();

  React.useEffect(() => {
    const attachZone = document.querySelector('.attach-zone') as HTMLElement;
    const attachButton = document.querySelector('.attach-btn') as HTMLElement;
    const pseudoInput = document.querySelector('#pseudo-input') as HTMLElement;

    // Drag'n'Drop helper function
    const handleDragEvent = (event, hoverAttachZone?: boolean) => {
      event.preventDefault();
      event.stopPropagation();

      if (isUploading) return;

      attachZone.classList[hoverAttachZone ? 'add' : 'remove']('hovered');
    };

    const handleUpload = async (file: File) => {
      if (!file) return;

      setIsUploading(true);

      const [_imageURL, _uploadStatus] = await uploadImage(file);
      setIsUploading(false);
      setUploadStatus(_uploadStatus);

      if (_imageURL) {
        setImageURL(imageURL);
        attachButton.style.display = 'none';
        props.uploadCompleteCallback(imageURL);
      }
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

      if (isUploading) return;

      setUploadStatus(undefined);

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
      if (isUploading) return;
      pseudoInput.click();
    };

    pseudoInput.addEventListener('change', pseudoInputHandler);
    attachZone.addEventListener('click', clickHandler);
  }, []);

  const { headerText, subheaderText } = props;

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
          uploadStatus === 'success'
            ? 'Image upload succeeded.'
            : uploadStatus === 'failure'
            ? 'Image upload failed.'
            : null
        }
        validationStatus={uploadStatus}
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
        <input
          type="file"
          accept="image/jpeg, image/jpg, image/png"
          id="pseudo-input"
        />
        {isUploading && <CWSpinner size="large" />}
        <div className="attach-btn">
          {!isUploading && <CWIcon iconName="imageUpload" iconSize="medium" />}
          <CWText type="caption" fontWeight="medium">
            Drag or upload your image here
          </CWText>
        </div>
      </div>
    </div>
  );
};
