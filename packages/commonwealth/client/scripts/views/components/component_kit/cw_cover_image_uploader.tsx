import React from 'react';
import 'components/component_kit/cw_cover_image_uploader.scss';
import $ from 'jquery';

import { redraw } from 'mithrilInterop';
import app from 'state';

import { CWIcon } from './cw_icons/cw_icon';
import { CWSpinner } from './cw_spinner';
import { getClasses } from './helpers';
import { CWTextInput, MessageRow } from './cw_text_input';
import type { ValidationStatus } from './cw_validation_text';
import { CWButton } from './cw_button';
import { CWIconButton } from './cw_icon_button';
import { CWText } from './cw_text';
import { CWRadioGroup } from './cw_radio_group';

type CoverImageUploaderProps = {
  headerText?: string;
  subheaderText?: string;
  enableGenerativeAI?: boolean;
  generatedImageCallback?: CallableFunction;
  defaultImageUrl?: string;
  defaultImageBehavior?: string;
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
export const CWCoverImageUploader = (props: CoverImageUploaderProps) => {
  const [imageURL, setImageURL] = React.useState<string>();
  const [isUploading, setIsUploading] = React.useState<boolean>();
  const [uploadStatus, setUploadStatus] = React.useState<
    ValidationStatus | undefined
  >();
  const [imageBehavior, setImageBehavior] = React.useState<ImageBehavior>();
  const [prompt, setPrompt] = React.useState<string>();
  const [isPrompting, setIsPrompting] = React.useState<boolean>();
  const [isGenerating, setIsGenerating] = React.useState<boolean>();
  const attachZone = React.useRef<HTMLDivElement>(null);
  const attachButton = React.useRef<HTMLDivElement>(null);
  const pseudoInput = React.useRef<HTMLInputElement>(null);

  const uploadImage = async (
    file: File
  ): Promise<[string, ValidationStatus]> => {
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

      const trimmedImageURL = uploadResponse.url?.replace(/\?.*/, '').trim();
      if (!trimmedImageURL) throw new Error();

      return [trimmedImageURL, 'success'];
    } catch (e) {
      return [null, 'failure'];
    }
  };

  const generateImage = async () => {
    try {
      const res = await $.post(`${app.serverUrl()}/generateImage`, {
        description: prompt,
        jwt: app.user.jwt,
      });

      if (isPrompting) {
        setImageURL(res.result.imageUrl);
        const currentImageBehavior = !imageBehavior
          ? ImageBehavior.Fill
          : imageBehavior;
        setImageBehavior(currentImageBehavior);
        setUploadStatus('success');
        attachButton.current.style.display = 'none';

        props.generatedImageCallback(res.result.imageUrl, currentImageBehavior);
        props.uploadCompleteCallback(res.result.imageUrl, currentImageBehavior);
      }

      setIsUploading(false);
      setIsPrompting(false);
      setIsGenerating(false);
      redraw();

      return res.result.imageUrl;
    } catch (e) {
      setUploadStatus('failure');
      setIsUploading(false);
      setIsPrompting(false);
      setIsGenerating(false);
      throw new Error(e);
    }
  };

  // Drag'n'Drop helper function
  const handleDragEvent = (event, hoverAttachZone?: boolean) => {
    event.preventDefault();
    event.stopPropagation();

    if (isUploading) return;

    attachZone.current.classList[hoverAttachZone ? 'add' : 'remove']('hovered');
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);

    const [_imageURL, _uploadStatus] = await uploadImage(file);
    setIsUploading(false);
    setUploadStatus(_uploadStatus);

    if (_imageURL) {
      setImageURL(_imageURL);
      const currentImageBehavior = !imageBehavior
        ? ImageBehavior.Fill
        : imageBehavior;
      setImageBehavior(currentImageBehavior);
      attachButton.current.style.display = 'none';
      uploadCompleteCallback(_imageURL, currentImageBehavior);
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

  // On-click support
  const pseudoInputHandler = (inputEvent: InputEvent) => {
    handleUpload((inputEvent.target as HTMLInputElement).files[0]);
  };

  const clickHandler = (e) => {
    e.stopImmediatePropagation();
    if (isUploading) return;
    pseudoInput.current?.click();
  };

  React.useEffect(() => {
    const { defaultImageUrl, defaultImageBehavior } = props;

    setImageURL(defaultImageUrl);
    setImageBehavior(defaultImageBehavior as ImageBehavior);
    setIsPrompting(false);

    pseudoInput.current.addEventListener('change', pseudoInputHandler);
    attachZone.current.addEventListener('click', (e: any) => {
      if (e.target.classList.contains('attach-zone')) clickHandler(e);
    });

    attachZone.current.addEventListener('dragenter', dragEnterHandler);
    attachZone.current.addEventListener('dragleave', dragLeaveHandler);
    attachZone.current.addEventListener('dragover', dragOverHandler);
    attachZone.current.addEventListener('drop', dropHandler);

    return () => {
      pseudoInput.current?.removeEventListener('change', pseudoInputHandler);
      attachZone.current?.removeEventListener('click', clickHandler);
      attachZone.current?.removeEventListener('dragenter', dragEnterHandler);
      attachZone.current?.removeEventListener('dragleave', dragLeaveHandler);
      attachZone.current?.removeEventListener('dragover', dragOverHandler);
      attachZone.current?.removeEventListener('drop', dropHandler);
    };
  }, []);

  const {
    headerText,
    subheaderText,
    enableGenerativeAI,
    uploadCompleteCallback,
  } = props;

  const isFillImage = imageBehavior === ImageBehavior.Fill;

  const backgroundStyles = {
    backgroundImage: imageURL ? `url(${imageURL})` : 'none',
    backgroundSize: isFillImage ? 'cover' : '100px',
    backgroundRepeat: isFillImage ? 'no-repeat' : 'repeat',
    backgroundPosition: isFillImage ? 'center' : '0 0',
  };

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
        style={backgroundStyles}
        ref={attachZone}
      >
        {uploadStatus === 'success' && enableGenerativeAI && (
          <CWButton
            label="retry"
            buttonType="mini-black"
            className="retry-button"
            onClick={(e) => {
              e.stopPropagation();
              setPrompt('');
              setIsPrompting(true);
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
                  setIsPrompting(false);
                  setIsGenerating(false);
                }}
                iconName="close"
                iconSize="small"
              />
            </div>
            {isGenerating ? (
              <CWSpinner size="large" />
            ) : (
              <>
                <CWTextInput
                  label="Prompt"
                  size="small"
                  value={prompt}
                  placeholder="type a description here"
                  onInput={(e) => {
                    setPrompt(e.target.value);
                  }}
                  iconRight="trash"
                  iconRightonClick={() => {
                    setPrompt('');
                  }}
                  containerClassName="prompt-input"
                />
                <CWButton
                  label="Generate"
                  buttonType="mini-black"
                  className="generate-btn"
                  onClick={async () => {
                    if (prompt.length < 1) return;
                    setIsGenerating(true);
                    try {
                      await generateImage();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
              </>
            )}
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg, image/jpg, image/png"
          className="pseudo-input"
          ref={pseudoInput}
        />
        {isUploading && <CWSpinner size="large" />}
        <div className="attach-btn" ref={attachButton}>
          {!isUploading && <CWIcon iconName="imageUpload" iconSize="medium" />}
          <CWText type="caption" fontWeight="medium">
            {headerText}
          </CWText>
          {enableGenerativeAI && !isUploading && (
            <CWButton
              buttonType="mini-white"
              label="Generate Image"
              className="generate-btn"
              onClick={(e) => {
                e.stopPropagation();
                setPrompt('');
                setIsPrompting(true);
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
          onChange={(e) => {
            setImageBehavior(e.target.value);
            uploadCompleteCallback(imageURL, e.target.value);
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
};
