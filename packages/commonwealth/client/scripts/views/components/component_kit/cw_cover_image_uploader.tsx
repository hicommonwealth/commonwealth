import 'components/component_kit/cw_cover_image_uploader.scss';
import useBrowserWindow from 'hooks/useBrowserWindow';
import React, { useEffect, useMemo, useRef } from 'react';
import { SERVER_URL } from 'state/api/config';
import { replaceBucketWithCDN } from '../../../helpers/awsHelpers';
import { CWIconButton } from './cw_icon_button';
import { CWButton } from './new_designs/CWButton';

import axios from 'axios';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { useFormContext } from 'react-hook-form';
import useUserStore from 'state/ui/user';
import { compressImage } from 'utils/ImageCompression';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { CWTextInput, MessageRow } from './cw_text_input';
import type { ValidationStatus } from './cw_validation_text';
import { getClasses } from './helpers';
import CWCircleMultiplySpinner from './new_designs/CWCircleMultiplySpinner';
import { MessageRow as NewMessageRow } from './new_designs/CWTextInput/MessageRow';
import { CWRadioButton } from './new_designs/cw_radio_button';

// TODO: currently it doesn't support "edit more", i.e if we set url in CWForm "initialValues", this component won't
// pick it up like the rest of CWForm hooked components do. Add suport for it when needed.
type CoverImageUploaderFormValidationProps = {
  name?: string;
  hookToForm?: boolean;
};

type CoverImageUploaderProps = CoverImageUploaderFormValidationProps & {
  headerText?: string;
  subheaderText?: string;
  enableGenerativeAI?: boolean;
  generatedImageCallback?: CallableFunction;
  defaultImageUrl?: string;
  uploadCompleteCallback?: CallableFunction;
  canSelectImageBehaviour?: boolean;
  defaultImageBehaviour?: ImageBehavior;
  showUploadAndGenerateText?: boolean;
  onImageBehaviourChange?: (behaviour: ImageBehavior) => void;
  onImageProcessStatusChange?: (isProcessing: boolean) => any;
};

export enum ImageAs {
  Cover = 'cover',
  Background = 'background',
}

export enum ImageBehavior {
  Fill = 'cover',
  Tiled = 'repeat',
  Circle = 'circle',
}

// TODO Graham 10/24/22: Synchronize avatar upload against new cover upload system
export const CWCoverImageUploader = ({
  name,
  hookToForm,
  headerText,
  subheaderText,
  enableGenerativeAI,
  generatedImageCallback,
  uploadCompleteCallback,
  defaultImageUrl,
  canSelectImageBehaviour = true,
  showUploadAndGenerateText,
  defaultImageBehaviour,
  onImageBehaviourChange,
  onImageProcessStatusChange = () => {},
}: CoverImageUploaderProps) => {
  const user = useUserStore();
  const [imageURL, setImageURL] = React.useState<string>();
  const [isUploading, setIsUploading] = React.useState<boolean>();
  const [uploadStatus, setUploadStatus] = React.useState<
    ValidationStatus | undefined
  >();
  const [imageBehavior, setImageBehavior] = React.useState<ImageBehavior>(
    // @ts-expect-error <StrictNullChecks/>
    defaultImageBehaviour,
  );
  const [prompt, setPrompt] = React.useState<string>();
  const [isPrompting, setIsPrompting] = React.useState<boolean>();
  const [isGenerating, setIsGenerating] = React.useState<boolean>();
  const attachZone = React.useRef<HTMLDivElement>(null);
  const attachButton = React.useRef<HTMLDivElement>(null);
  const pseudoInput = React.useRef<HTMLInputElement>(null);

  const { isWindowExtraSmall } = useBrowserWindow({});

  const formContext = useFormContext();
  hookToForm && name && formContext.register(name);
  const formFieldErrorMessage =
    hookToForm &&
    name &&
    (formContext?.formState?.errors?.[name]?.message as string);

  const canResetValue = useRef(true);
  const [defaultFormContext, setDefaultFormContext] = React.useState({
    isSet: false,
    value: hookToForm && name ? formContext?.getValues?.(name) : null,
  });

  useNecessaryEffect(() => {
    if (defaultFormContext.value && !defaultFormContext.isSet) {
      canResetValue.current = false;
      // @ts-expect-error <StrictNullChecks/>
      attachButton.current.style.display = 'flex';

      setImageURL(defaultFormContext.value);
      setImageBehavior(defaultImageBehaviour || ImageBehavior.Circle);
      setDefaultFormContext({
        isSet: true,
        value: defaultFormContext.value,
      });

      // @ts-expect-error <StrictNullChecks/>
      formContext.setValue(name, defaultFormContext.value);
      // @ts-expect-error <StrictNullChecks/>
      formContext.setError(name, null);
      setTimeout(() => {
        canResetValue.current = true;
      }, 1000);
    }
  }, [defaultFormContext, imageBehavior, formContext]);

  useEffect(() => {
    // @ts-expect-error <StrictNullChecks/>
    onImageProcessStatusChange(isUploading || isGenerating);
  }, [isUploading, isGenerating, onImageProcessStatusChange]);

  useNecessaryEffect(() => {
    if (!imageURL && canResetValue.current && formContext && name) {
      formContext.setValue(name, '');
    }
  }, [imageURL, formContext, name]);

  const uploadImage = async (
    file: File,
  ): Promise<[string, ValidationStatus]> => {
    try {
      const signatureResponse = await axios.post(
        `${SERVER_URL}/getUploadSignature`,
        {
          name: file.name,
          mimetype: file.type,
          auth: true,
          jwt: user.jwt,
        },
      );
      if (signatureResponse.data.status !== 'Success') throw new Error();

      const compressedImage = await compressImage(file);

      const uploadURL = signatureResponse.data.result;
      const uploadResponse = await fetch(uploadURL, {
        method: 'put',
        body: compressedImage,
      });

      const trimmedImageURL = uploadResponse.url?.replace(/\?.*/, '').trim();
      if (!trimmedImageURL) throw new Error();

      return [replaceBucketWithCDN(trimmedImageURL), 'success'];
    } catch (e) {
      // @ts-expect-error <StrictNullChecks/>
      return [null, 'failure'];
    }
  };

  const generateImage = async () => {
    try {
      setImageURL('');
      const res = await axios.post(`${SERVER_URL}/generateImage`, {
        description: prompt,
        jwt: user.jwt,
      });

      const generatedImageURL = res.data.result.imageUrl;

      if (isPrompting) {
        setImageURL(generatedImageURL);
        if (hookToForm && name && formContext) {
          formContext.setValue(name, generatedImageURL);
          // @ts-expect-error <StrictNullChecks/>
          formContext.setError(name, null);
        }
        const currentImageBehavior = !imageBehavior
          ? ImageBehavior.Fill
          : imageBehavior;
        setImageBehavior(currentImageBehavior);
        setUploadStatus('success');
        if (defaultImageBehaviour !== ImageBehavior.Circle) {
          // @ts-expect-error <StrictNullChecks/>
          attachButton.current.style.display = 'none';
        }

        generatedImageCallback?.(generatedImageURL, currentImageBehavior);
        uploadCompleteCallback?.(generatedImageURL, currentImageBehavior);
      }

      setIsUploading(false);
      setIsPrompting(false);
      setIsGenerating(false);

      return generatedImageURL;
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

    // @ts-expect-error <StrictNullChecks/>
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
      if (hookToForm && name && formContext) {
        formContext.setValue(name, _imageURL);
        // @ts-expect-error <StrictNullChecks/>
        formContext.setError(name, null);
      }
      const currentImageBehavior = !imageBehavior
        ? ImageBehavior.Fill
        : imageBehavior;
      setImageBehavior(currentImageBehavior);
      if (defaultImageBehaviour !== ImageBehavior.Circle) {
        // @ts-expect-error <StrictNullChecks/>
        attachButton.current.style.display = 'none';
      }
      uploadCompleteCallback?.(_imageURL, currentImageBehavior);
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

    // @ts-expect-error <StrictNullChecks/>
    const { files } = dropEvent.dataTransfer;
    handleUpload(files[0]);
  };

  // On-click support
  const pseudoInputHandler = (inputEvent: InputEvent) => {
    // @ts-expect-error <StrictNullChecks/>
    handleUpload((inputEvent.target as HTMLInputElement).files[0]);
  };

  const clickHandler = (e) => {
    e?.stopImmediatePropagation?.();
    if (isUploading) return;
    pseudoInput.current?.click();
  };

  React.useEffect(() => {
    setImageURL(defaultImageUrl);
    setIsPrompting(false);

    // @ts-expect-error <StrictNullChecks/>
    pseudoInput.current.addEventListener('change', pseudoInputHandler);
    // @ts-expect-error <StrictNullChecks/>
    attachZone.current.addEventListener('click', (e: any) => {
      if (e.target.classList.contains('attach-btn')) clickHandler(e);
      if (e.target.classList.contains('attach-zone')) clickHandler(e);
    });

    // @ts-expect-error <StrictNullChecks/>
    attachZone.current.addEventListener('dragenter', dragEnterHandler);
    // @ts-expect-error <StrictNullChecks/>
    attachZone.current.addEventListener('dragleave', dragLeaveHandler);
    // @ts-expect-error <StrictNullChecks/>
    attachZone.current.addEventListener('dragover', dragOverHandler);
    // @ts-expect-error <StrictNullChecks/>
    attachZone.current.addEventListener('drop', dropHandler);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      pseudoInput.current?.removeEventListener('change', pseudoInputHandler);
      attachZone.current?.removeEventListener('click', clickHandler);
      attachZone.current?.removeEventListener('dragenter', dragEnterHandler);
      attachZone.current?.removeEventListener('dragleave', dragLeaveHandler);
      attachZone.current?.removeEventListener('dragover', dragOverHandler);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      attachZone.current?.removeEventListener('drop', dropHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFillImage = imageBehavior === ImageBehavior.Fill;

  const backgroundStyles = useMemo(
    () => ({
      backgroundImage:
        imageURL && defaultImageBehaviour !== ImageBehavior.Circle
          ? `url(${imageURL})`
          : 'none',
      backgroundSize: isFillImage ? 'cover' : '100px',
      backgroundRepeat: isFillImage ? 'no-repeat' : 'repeat',
      backgroundPosition: isFillImage ? 'center' : '0 0',
    }),
    [imageURL, defaultImageBehaviour, isFillImage],
  );

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
        // @ts-expect-error <StrictNullChecks/>
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
          validationStatus: 'failure' | undefined;
        }>(
          {
            // @ts-expect-error <StrictNullChecks/>
            isUploading,
            // @ts-expect-error <StrictNullChecks/>
            uploadStatus,
            validationStatus: formFieldErrorMessage ? 'failure' : undefined,
          },
          'attach-zone',
        )}
        style={backgroundStyles}
        ref={attachZone}
      >
        {uploadStatus === 'success' &&
          enableGenerativeAI &&
          !showUploadAndGenerateText && (
            <CWButton
              label="retry"
              buttonHeight="sm"
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
              <CWCircleMultiplySpinner />
            ) : (
              <>
                <CWTextInput
                  autoFocus={true}
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
                  buttonHeight="sm"
                  className="generate-btn"
                  onClick={async () => {
                    // @ts-expect-error <StrictNullChecks/>
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
        {isUploading && <CWCircleMultiplySpinner />}
        <div className="attach-btn" ref={attachButton}>
          {imageURL && defaultImageBehaviour === ImageBehavior.Circle && (
            <img className="circle-img" src={imageURL} />
          )}
          {!isUploading && !imageURL && (
            <CWIcon iconName="imageSquare" iconSize="large" weight="fill" />
          )}
          {headerText && !imageURL && (
            <CWText type="caption" fontWeight="medium">
              {headerText}
            </CWText>
          )}
          {showUploadAndGenerateText && !isUploading && !imageURL && (
            <CWText
              type={isWindowExtraSmall ? 'caption' : 'b1'}
              fontWeight="medium"
              className="upload-generate-text"
            >
              {isWindowExtraSmall ? 'Tap ' : 'Click or drag '}
              to upload an image here or generate one below
            </CWText>
          )}
          {enableGenerativeAI && !isUploading && (
            <CWButton
              buttonHeight="sm"
              containerClassName="generate-btn"
              type="button"
              buttonType="secondary"
              label="Generate Image"
              onClick={(e) => {
                e.stopPropagation();
                setPrompt('');
                setIsPrompting(true);
              }}
            />
          )}
        </div>
      </div>
      <NewMessageRow
        hasFeedback={!!formFieldErrorMessage}
        // @ts-expect-error <StrictNullChecks/>
        statusMessage={formFieldErrorMessage}
        validationStatus={formFieldErrorMessage ? 'failure' : undefined}
      />
      {canSelectImageBehaviour && (
        <div className="options">
          <CWText
            type="caption"
            fontWeight="medium"
            className="cover-image-title"
          >
            Choose image behavior
          </CWText>
          {['Fill', 'Tiled'].map((option) => (
            <CWRadioButton
              key={option}
              value={ImageBehavior[option]}
              label={option}
              groupName="image-behaviour"
              checked={imageBehavior === ImageBehavior[option]}
              onChange={(e) => {
                if (e.target.checked) {
                  setImageBehavior(ImageBehavior[option]);
                  onImageBehaviourChange?.(ImageBehavior[option]);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
