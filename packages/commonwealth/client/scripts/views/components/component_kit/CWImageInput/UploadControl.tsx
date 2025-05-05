import clsx from 'clsx';
import React from 'react';
import { generateImagePromptWithContext } from 'state/api/ai/prompts';
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
  usePersistentPromptMode,
  onAddCurrentToReference,
  canAddCurrentToReference,
  referenceImageUrls,
  referenceTexts,
  model,
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
    hasAnyGeneratedImages,
    startNewPrompt,
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
    usePersistentPromptMode,
    onAddCurrentToReference,
    canAddCurrentToReference,
    referenceImageUrls,
    referenceTexts,
    model,
  });

  const isSmallScreen = isWindowExtraSmall;

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
          <CWText type="caption" fontWeight="medium" className="loading-text">
            Image generation may take up to 15-20 seconds...
          </CWText>
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
                type={isSmallScreen ? 'caption' : 'b1'}
                fontWeight="medium"
                className="gray"
              >
                {placeholder}
              </CWText>
            </>
          )}

          {/* --- Add to References Button START --- */}
          {/* ---- MOVED ---- */}
          {/* --- Add to References Button END --- */}

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

          {/* --- Main Action Button Area START --- */}
          {withAIImageGeneration &&
            (usePersistentPromptMode &&
            hasAnyGeneratedImages &&
            processedImages.length > 0 ? (
              <div className="persistent-actions-row">
                <>
                  {imageToRender &&
                    canAddCurrentToReference &&
                    onAddCurrentToReference && (
                      <CWButton
                        label={isSmallScreen ? 'Remix' : 'Save to Remix'}
                        iconLeft="plusCirclePhosphor"
                        buttonType="secondary"
                        buttonHeight="sm"
                        buttonWidth="narrow"
                        type="button"
                        containerClassName="btn-focus-styles add-to-ref-btn"
                        disabled={isLoading || areActionsDisabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddCurrentToReference();
                        }}
                      />
                    )}
                  <CWButton
                    label={isSmallScreen ? 'Edit' : 'Edit'}
                    iconLeft="pencil"
                    buttonType="secondary"
                    buttonHeight="sm"
                    buttonWidth="narrow"
                    type="button"
                    containerClassName="btn-focus-styles"
                    disabled={areActionsDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      startNewPrompt();
                    }}
                  />
                  <CWButton
                    label={isSmallScreen ? 'Redo' : 'Generate'}
                    iconLeft="sparkle"
                    buttonType="secondary"
                    buttonHeight="sm"
                    buttonWidth="narrow"
                    type="button"
                    containerClassName="btn-focus-styles"
                    disabled={areActionsDisabled || !imagePrompt.trim()}
                    onClick={(e) => {
                      e.stopPropagation();
                      imagePrompt.trim() &&
                        generateImage({
                          prompt: generateImagePromptWithContext(
                            imagePrompt,
                            referenceTexts,
                            !!referenceImageUrls &&
                              referenceImageUrls.length > 0,
                          ),
                          referenceImageUrls,
                          size: '1024x1024', // Example size
                          model,
                        }).catch(console.error);
                    }}
                  />
                </>
              </div>
            ) : (
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
                  e.stopPropagation(); // Prevent opening file picker
                  setIsImageGenerationSectionOpen(true);
                }}
                buttonWidth={
                  !imageToRender || imageBehavior === ImageBehavior.Circle
                    ? 'narrow'
                    : 'full'
                }
                disabled={areActionsDisabled}
              />
            ))}
        </>
      )}
      {isImageGenerationSectionOpen && (
        <div
          className="generate-image-section"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && imagePrompt.trim()) {
              e.preventDefault();
              e.stopPropagation();
              generateImage({
                prompt: generateImagePromptWithContext(
                  imagePrompt,
                  referenceTexts,
                  !!referenceImageUrls && referenceImageUrls.length > 0,
                ),
                referenceImageUrls,
                size: '1024x1024', // Example size
                model,
              }).catch(console.error);
            }
          }}
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
          {/* Button inside the modal - always "Generate" */}
          <div className="generate-buttons-row">
            <CWButton
              label="Generate"
              buttonHeight="sm"
              buttonWidth="narrow"
              type="button"
              containerClassName="btn-focus-styles"
              disabled={areActionsDisabled || !imagePrompt.trim()}
              onClick={() => {
                imagePrompt.trim() &&
                  generateImage({
                    prompt: generateImagePromptWithContext(
                      imagePrompt,
                      referenceTexts,
                      !!referenceImageUrls && referenceImageUrls.length > 0,
                    ),
                    referenceImageUrls,
                    size: '1024x1024', // Example size
                    model,
                  }).catch(console.error);
              }}
            />
          </div>
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
