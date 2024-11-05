import clsx from 'clsx';
import React from 'react';
import { CWIcon } from '../cw_icons/cw_icon';
import { CWText } from '../cw_text';
import { CWButton } from '../new_designs/CWButton';
import CWCircleMultiplySpinner from '../new_designs/CWCircleMultiplySpinner';
import CWIconButton from '../new_designs/CWIconButton';
import { CWTextInput } from '../new_designs/CWTextInput';
import { MessageRow } from '../new_designs/CWTextInput/MessageRow';
import { ImageBehavior, UploadControlProps } from './types';
import { useUploadControl } from './useUploadControl';

export const UploadControl = ({
  name,
  hookToForm,
  imageURL,
  withAIImageGeneration,
  disabled,
  loading,
  imageBehavior = ImageBehavior.Circle,
  uploadControlClassName,
  canSwitchBetweenProcessedImages,
  processedImages: providedProcessedImages,
  onImageProcessingChange,
  onImageGenerated,
  onImageUploaded,
  onProcessedImagesListChange,
}: UploadControlProps) => {
  const {
    areActionsDisabled,
    isLoading,
    isDraggingFile,
    formFieldErrorMessage,
    imageToRender,
    openFilePicker,
    registeredFormContext,
    dropzoneRef,
    imageInputRef,
    setImageInputRefUpdated,
    processedImages,
    activeImageIndex,
    isWindowExtraSmall,
    updateActiveImageIndex,
    isHookedToForm,
    placeholder,
    setIsImageGenerationSectionOpen,
    setImagePrompt,
    isImageGenerationSectionOpen,
    imagePrompt,
    generateImage,
  } = useUploadControl({
    name,
    hookToForm,
    imageURL,
    withAIImageGeneration,
    disabled,
    loading,
    imageBehavior,
    uploadControlClassName,
    canSwitchBetweenProcessedImages,
    processedImages: providedProcessedImages,
    onImageProcessingChange,
    onImageGenerated,
    onImageUploaded,
    onProcessedImagesListChange,
  });

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
        ref={(el) => {
          if (!imageInputRef.current) {
            imageInputRef.current = el;
            setImageInputRefUpdated(true);
          }
        }}
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
            <>
              {imageBehavior === ImageBehavior.Tiled ? (
                <div
                  style={{
                    backgroundImage: `url(${imageToRender})`,
                  }}
                  className={`img-${imageBehavior}`}
                />
              ) : (
                <img
                  key={imageToRender}
                  src={imageToRender}
                  className={`img-${imageBehavior}`}
                />
              )}
            </>
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

          {canSwitchBetweenProcessedImages && activeImageIndex >= 0 && (
            <>
              <CWIconButton
                iconName="caretLeft"
                disabled={areActionsDisabled || activeImageIndex === 0}
                className="switch-left-btn"
                buttonSize="lg"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateActiveImageIndex(activeImageIndex - 1);
                }}
              />
              <CWIconButton
                iconName="caretRight"
                disabled={
                  areActionsDisabled ||
                  activeImageIndex === processedImages.length - 1
                }
                className="switch-right-btn"
                buttonSize="lg"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateActiveImageIndex(activeImageIndex + 1);
                }}
              />
            </>
          )}

          {withAIImageGeneration && (
            <CWButton
              buttonHeight="sm"
              type="button"
              buttonType="secondary"
              label="Generate Image"
              containerClassName={clsx('btn-focus-styles generate-img-btn', {
                autoMarginTop:
                  imageToRender &&
                  (imageBehavior === ImageBehavior.Fill ||
                    imageBehavior === ImageBehavior.Tiled),
              })}
              onClick={(e) => {
                e.stopPropagation();
                setIsImageGenerationSectionOpen(true);
              }}
              buttonWidth={
                !imageToRender || imageBehavior === ImageBehavior.Circle
                  ? 'narrow'
                  : 'full'
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
            type="button"
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
