import clsx from 'clsx';
import React from 'react';
import { MessageRow } from '../cw_text_input';
import './CWImageInput.scss';
import {
  ImageBehaviorSelector,
  ImageBehaviorSelectorProps,
} from './ImageBehaviorSelector';
import { UploadControl } from './UploadControl';
import { ImageBehavior, UploadControlProps } from './types';

type CWImageInputProps = UploadControlProps &
  ImageBehaviorSelectorProps & {
    label?: string;
    containerClassname?: string;
  };

export const CWImageInput = ({
  // upload control props
  name = `CWImageInput-${Math.random()}`,
  hookToForm,
  imageURL,
  withAIImageGeneration,
  uploadControlClassName,
  onImageGenerated,
  onImageUploaded,
  onImageProcessingChange,
  onProcessedImagesListChange,
  canSwitchBetweenProcessedImages,
  processedImages,
  loading,
  // image behavior props
  canSelectImageBehavior = false,
  onImageBehaviorChange,
  imageBehaviorSelectorClassName,
  allowedImageBehaviours,
  // common props
  imageBehavior = ImageBehavior.Circle,
  label = 'Accepts JPG and PNG files.',
  disabled,
  containerClassname,
}: CWImageInputProps) => {
  return (
    <div className={clsx('CWImageInput', containerClassname)}>
      <MessageRow label={label} hasFeedback={true} />
      <UploadControl
        name={name}
        hookToForm={hookToForm}
        imageURL={imageURL}
        withAIImageGeneration={withAIImageGeneration}
        disabled={disabled}
        loading={loading}
        imageBehavior={imageBehavior}
        uploadControlClassName={uploadControlClassName}
        canSwitchBetweenProcessedImages={canSwitchBetweenProcessedImages}
        onImageGenerated={onImageGenerated}
        onImageUploaded={onImageUploaded}
        onImageProcessingChange={onImageProcessingChange}
        onProcessedImagesListChange={onProcessedImagesListChange}
        processedImages={processedImages}
      />
      <ImageBehaviorSelector
        imageBehavior={imageBehavior}
        canSelectImageBehavior={canSelectImageBehavior}
        onImageBehaviorChange={onImageBehaviorChange}
        imageBehaviorSelectorClassName={imageBehaviorSelectorClassName}
        disabled={disabled}
        allowedImageBehaviours={allowedImageBehaviours}
      />
    </div>
  );
};
