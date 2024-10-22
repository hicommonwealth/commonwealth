import clsx from 'clsx';
import { notifyError } from 'controllers/app/notifications';
import useBrowserWindow from 'hooks/useBrowserWindow';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import useGenerateImageMutation from 'state/api/general/generateImage';
import useUploadFileMutation from 'state/api/general/uploadFile';
import { CWIcon } from '../cw_icons/cw_icon';
import { CWText } from '../cw_text';
import { CWButton } from '../new_designs/CWButton';
import CWCircleMultiplySpinner from '../new_designs/CWCircleMultiplySpinner';
import CWIconButton from '../new_designs/CWIconButton';
import { CWTextInput } from '../new_designs/CWTextInput';
import { MessageRow } from '../new_designs/CWTextInput/MessageRow';
import { ImageBehavior } from './types';

type ImageProcessingProps = {
  isGenerating: boolean;
  isUploading: boolean;
};

export type UploadControlProps = {
  imageURL?: string;
  onImageProcessingChange?: (process: ImageProcessingProps) => void;
  onImageGenerated?: (generatedImageUrl: string) => void;
  onImageUploaded?: (uploadedImageURL: string) => void;
  withAIImageGeneration?: boolean;
  disabled?: boolean;
  name?: string;
  hookToForm?: boolean;
  imageBehavior?: ImageBehavior;
  uploadControlClassName?: string;
};

export const UploadControl = ({
  name,
  hookToForm,
  imageURL,
  withAIImageGeneration,
  disabled,
  imageBehavior = ImageBehavior.Circle,
  uploadControlClassName,
  onImageProcessingChange,
  onImageGenerated,
  onImageUploaded,
}: UploadControlProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [imageToRender, setImageToRender] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isImageGenerationSectionOpen, setIsImageGenerationSectionOpen] =
    useState(false);

  const formContext = useFormContext();
  const isHookedToForm = name && hookToForm;
  const formContextRef = useRef(isHookedToForm ? { formContext, name } : null);
  const registeredFormContext = isHookedToForm
    ? formContext.register(name)
    : null;
  const formFieldValue: string | null = isHookedToForm
    ? formContext?.watch?.(name)
    : null;
  const formFieldErrorMessage =
    hookToForm &&
    name &&
    (formContext?.formState?.errors?.[name]?.message as string);

  // update formContextRef whenever formContext changes
  useEffect(() => {
    formContextRef.current = isHookedToForm ? { formContext, name } : null;
  }, [isHookedToForm, formContext, name]);

  // update `imageToRender` from formContext whenever it changes (if component is hooked to form)
  useEffect(() => {
    if (formFieldValue !== imageToRender && formFieldValue !== null) {
      setImageToRender(formFieldValue);

      // reset errors if there are any
      if ((formFieldValue || imageToRender) && formContextRef.current) {
        formContextRef.current.formContext
          .trigger(formContextRef.current?.name)
          .catch(console.error);
      }
    }
  }, [formFieldValue, imageToRender]);

  const { isWindowExtraSmall } = useBrowserWindow({});

  const {
    data: uploadedImageURL,
    isLoading: isUploadingImage,
    mutateAsync: uploadPickedImage,
    error: imageUploadError,
  } = useUploadFileMutation({
    onSuccess: onImageUploaded,
  });

  const {
    data: generatedImageURL,
    isLoading: isGeneratingImage,
    mutateAsync: generateImage,
    error: generateImageError,
  } = useGenerateImageMutation({
    onSuccess: onImageGenerated,
  });

  useEffect(() => {
    // this will override any image that is shown, if an image is being uploaded or generated
    // then that generated/uploaded image will override this one, once that is finished
    if (imageURL) {
      if (formContextRef.current?.formContext && formContextRef.current?.name) {
        formContextRef.current.formContext.setValue(
          formContextRef.current?.name,
          imageURL,
          { shouldDirty: true },
        );
      }
      setImageToRender(imageURL);
    }
  }, [imageURL]);

  useEffect(() => {
    if (uploadedImageURL) {
      if (formContextRef.current?.formContext && formContextRef.current?.name) {
        formContextRef.current.formContext.setValue(
          formContextRef.current?.name,
          uploadedImageURL,
          { shouldDirty: true },
        );
      }
      setImageToRender(uploadedImageURL);
    }
  }, [uploadedImageURL]);

  useEffect(() => {
    imageUploadError &&
      notifyError('Failed to upload image. Please try again!');
  }, [imageUploadError]);

  useEffect(() => {
    if (generatedImageURL) {
      setImagePrompt('');
      setIsImageGenerationSectionOpen(false);
      if (formContextRef.current?.formContext && formContextRef.current?.name) {
        formContextRef.current.formContext.setValue(
          formContextRef.current?.name,
          generatedImageURL,
          { shouldDirty: true },
        );
      }
      setImageToRender(generatedImageURL);
    }
  }, [generatedImageURL]);

  useEffect(() => {
    generateImageError &&
      notifyError('Failed to generate image. Please try again!');
  }, [generateImageError]);

  useEffect(() => {
    onImageProcessingChange &&
      onImageProcessingChange({
        isGenerating: isGeneratingImage,
        isUploading: isUploadingImage,
      });
  }, [onImageProcessingChange, isGeneratingImage, isUploadingImage]);

  const isLoading = isUploadingImage || isGeneratingImage;
  const areActionsDisabled = disabled || !imageInputRef.current || isLoading;
  const placeholder = `${
    isWindowExtraSmall ? 'Tap ' : 'Click or drag '
  } to upload an image here${
    withAIImageGeneration ? ' or generate one below' : ''
  }`;

  const openFilePicker = () => {
    if (areActionsDisabled) return;

    imageInputRef?.current?.click();
  };

  const handlePickedFile = useCallback(
    (inputEvent: InputEvent) => {
      const file = inputEvent?.target
        ? (inputEvent.target as HTMLInputElement)?.files?.[0]
        : null;

      if (areActionsDisabled || !file) return;

      uploadPickedImage({ file }).catch(console.error);
    },
    [areActionsDisabled, uploadPickedImage],
  );

  const handleFileDrag = useCallback(
    (event: DragEvent) => {
      if (areActionsDisabled) return;

      event.preventDefault();
      event.stopPropagation();

      // if relatedTarget is not present, hover is on the component
      setIsDraggingFile(!event.relatedTarget);

      if (event.type === 'drop' && event.dataTransfer) {
        setIsDraggingFile(false);

        const file = event.dataTransfer.files[0];

        if (areActionsDisabled || !file) return;

        uploadPickedImage({ file }).catch(console.error);
      }
    },
    [areActionsDisabled, uploadPickedImage],
  );

  // attach events to file input
  useEffect(() => {
    const internalImageInputRef = imageInputRef.current;

    if (internalImageInputRef) {
      internalImageInputRef.addEventListener('change', handlePickedFile);
    }

    return () => {
      if (internalImageInputRef) {
        internalImageInputRef.removeEventListener('change', handlePickedFile);
      }
    };
  }, [handlePickedFile]);

  // attach events to file drop zone
  useEffect(() => {
    const internalDropzoneRef = dropzoneRef.current;
    if (internalDropzoneRef) {
      internalDropzoneRef.addEventListener('dragenter', handleFileDrag);
      internalDropzoneRef.addEventListener('dragleave', handleFileDrag);
      internalDropzoneRef.addEventListener('dragover', handleFileDrag);
      internalDropzoneRef.addEventListener('drop', handleFileDrag);
    }

    return () => {
      if (internalDropzoneRef) {
        internalDropzoneRef.removeEventListener('dragenter', handleFileDrag);
        internalDropzoneRef.removeEventListener('dragleave', handleFileDrag);
        internalDropzoneRef.removeEventListener('dragover', handleFileDrag);
        internalDropzoneRef.removeEventListener('drop', handleFileDrag);
      }
    };
  }, [handleFileDrag]);

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx(
        'UploadControl',
        { disabled: areActionsDisabled },
        { isLoading },
        { hovered: isDraggingFile },
        { formError: !!formFieldErrorMessage },
        { hasImageURL: !!imageToRender },
        uploadControlClassName,
      )}
      onClick={() => openFilePicker()}
      onKeyUp={(e) =>
        e.target === e.currentTarget &&
        (e.key === 'Enter' || e.key === ' ') &&
        openFilePicker()
      }
      aria-label=""
      ref={dropzoneRef}
    >
      <input
        type="file"
        accept="image/jpeg, image/jpg, image/png"
        className="file-input"
        ref={imageInputRef}
        disabled={areActionsDisabled}
      />
      {isHookedToForm && registeredFormContext && (
        <input type="text" {...registeredFormContext} hidden />
      )}
      {isLoading ? (
        <div className="loading-container">
          <CWCircleMultiplySpinner />
        </div>
      ) : (
        <>
          {imageToRender ? (
            <img
              key={imageToRender}
              src={imageToRender}
              className={`img-${imageBehavior}`}
            />
          ) : (
            <>
              <CWIcon
                iconName="imageSquare"
                iconSize="large"
                weight="fill"
                className="gray"
              />
              <CWText
                type={isWindowExtraSmall ? 'caption' : 'b1'}
                fontWeight="medium"
                className="gray"
              >
                {placeholder}
              </CWText>
            </>
          )}

          {withAIImageGeneration && (
            <CWButton
              buttonHeight="sm"
              type="button"
              buttonType="secondary"
              label="Generate Image"
              containerClassName={clsx('btn-focus-styles generate-img-btn', {
                isFillImageBehaviour: imageBehavior === ImageBehavior.Fill,
              })}
              onClick={(e) => {
                e.stopPropagation();
                setIsImageGenerationSectionOpen(true);
              }}
              buttonWidth={
                imageBehavior === ImageBehavior.Fill ? 'full' : 'narrow'
              }
              disabled={areActionsDisabled}
            />
          )}
        </>
      )}
      {isImageGenerationSectionOpen && (
        <div
          className="generate-image-section"
          onClick={(e) => e.stopPropagation()}
        >
          <CWIconButton
            onClick={(e) => {
              e.stopPropagation();
              setImagePrompt('');
              setIsImageGenerationSectionOpen(false);
            }}
            iconName="close"
            buttonSize="sm"
            className="close-btn"
            disabled={areActionsDisabled}
          />
          <CWTextInput
            autoFocus={true}
            label="Prompt"
            size="small"
            fullWidth
            containerClassName="prompt-input-container"
            inputClassName="prompt-input"
            placeholder="Type a prompt to generate an image"
            disabled={areActionsDisabled}
            value={imagePrompt}
            onInput={(e) =>
              !areActionsDisabled && setImagePrompt(e.target?.value || '')
            }
            iconRight={
              <CWIcon
                iconName="trash"
                onClick={(e) => {
                  e.stopPropagation();
                  setImagePrompt('');
                }}
              />
            }
          />
          <CWButton
            label="Generate"
            buttonHeight="sm"
            buttonWidth="narrow"
            type="button"
            containerClassName="btn-focus-styles"
            disabled={areActionsDisabled}
            onClick={() => {
              imagePrompt &&
                generateImage({ prompt: imagePrompt.trim() }).catch(
                  console.error,
                );
            }}
          />
        </div>
      )}
      {formFieldErrorMessage && (
        <div
          className="form-validation-error"
          onClick={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
        >
          <MessageRow
            hasFeedback={!!formFieldErrorMessage}
            statusMessage={formFieldErrorMessage}
            validationStatus={formFieldErrorMessage ? 'failure' : undefined}
          />
        </div>
      )}
    </div>
  );
};
