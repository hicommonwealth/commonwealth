import { notifyError } from 'controllers/app/notifications';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import useGenerateImageMutation from 'state/api/general/generateImage';
import useUploadFileMutation from 'state/api/general/uploadFile';
import { ImageProcessed, UploadControlProps } from './types';

export const useUploadControl = ({
  name,
  hookToForm,
  imageURL,
  withAIImageGeneration,
  disabled,
  processedImages: providedProcessedImages,
  onImageProcessingChange,
  onImageGenerated,
  onImageUploaded,
  onProcessedImagesListChange,
}: UploadControlProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [imageToRender, setImageToRender] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isImageGenerationSectionOpen, setIsImageGenerationSectionOpen] =
    useState(false);
  const [processedImages, setProcessedImages] = useState<ImageProcessed[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(-1);
  const processedImagesRef = useRef(processedImages);

  const { isWindowExtraSmall } = useBrowserWindow({});

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

  const placeholder = `${
    isWindowExtraSmall ? 'Tap ' : 'Click or drag '
  } to upload an image here${
    withAIImageGeneration ? ' or generate one below' : ''
  }`;

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

  const isLoading = isUploadingImage || isGeneratingImage;
  const areActionsDisabled = disabled || !imageInputRef.current || isLoading;

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

  const updateActiveImageIndex = (index: number) => {
    if (formContextRef.current?.formContext && formContextRef.current?.name) {
      formContextRef.current.formContext.setValue(
        formContextRef.current?.name,
        processedImages[index].url,
        { shouldDirty: true },
      );
    }

    setActiveImageIndex(index);
  };

  // use this hook for any props that can rapidly change but have the same value as last time
  useNecessaryEffect(() => {
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
      const shouldUpdate =
        processedImagesRef.current.findIndex(
          (i) => i.url === imageURL.trim(),
        ) === -1;
      if (shouldUpdate) {
        setProcessedImages((images) => [
          ...images,
          {
            url: imageURL,
            isGenerated: false,
            isUploaded: false,
            isProvidedViaProps: true,
            isProvidedViaFormState: false,
            unixTimestamp: new Date().getTime(),
          },
        ]);
      }
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
      const shouldUpdate =
        processedImagesRef.current.findIndex(
          (i) => i.url === uploadedImageURL.trim(),
        ) === -1;
      if (shouldUpdate) {
        setProcessedImages((images) => [
          ...images,
          {
            url: uploadedImageURL,
            isGenerated: false,
            isUploaded: true,
            isProvidedViaProps: false,
            isProvidedViaFormState: false,
            unixTimestamp: new Date().getTime(),
          },
        ]);
      }
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
      const shouldUpdate =
        processedImagesRef.current.findIndex(
          (i) => i.url === generatedImageURL.trim(),
        ) === -1;
      if (shouldUpdate) {
        setProcessedImages((images) => [
          ...images,
          {
            url: generatedImageURL,
            isGenerated: true,
            isUploaded: false,
            isProvidedViaProps: false,
            isProvidedViaFormState: false,
            unixTimestamp: new Date().getTime(),
          },
        ]);
      }
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

  const onProcessedImagesListChangeRef = useRef(onProcessedImagesListChange);

  useEffect(() => {
    onProcessedImagesListChangeRef.current = onProcessedImagesListChange;
  }, [onProcessedImagesListChange]);

  useEffect(() => {
    processedImagesRef.current = processedImages;
    setActiveImageIndex(processedImages.length - 1);

    processedImages.length > 0 &&
      onProcessedImagesListChangeRef.current?.(processedImages);
  }, [processedImages]);

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

  // update formContextRef whenever formContext changes
  useEffect(() => {
    formContextRef.current = isHookedToForm ? { formContext, name } : null;
  }, [isHookedToForm, formContext, name]);

  // use this hook for any props that can rapidly change but have the same value as last time
  useNecessaryEffect(() => {
    // this will override any current processing of images in local state
    if (providedProcessedImages) {
      setProcessedImages(providedProcessedImages);
      setActiveImageIndex(providedProcessedImages.length - 1);
    }
  }, [providedProcessedImages]);

  // update `imageToRender` from formContext whenever it changes (if component is hooked to form)
  useEffect(() => {
    if (formFieldValue !== imageToRender && formFieldValue !== null) {
      setImageToRender(formFieldValue);
      if (formFieldValue) {
        const shouldUpdate =
          processedImagesRef.current.findIndex(
            (i) => i.url === formFieldValue.trim(),
          ) === -1;
        if (shouldUpdate) {
          setProcessedImages((images) => [
            ...images,
            {
              url: formFieldValue,
              isGenerated: false,
              isUploaded: false,
              isProvidedViaProps: false,
              isProvidedViaFormState: true,
              unixTimestamp: new Date().getTime(),
            },
          ]);
        }
      }

      // reset errors if there are any
      if ((formFieldValue || imageToRender) && formContextRef.current) {
        formContextRef.current.formContext
          .trigger(formContextRef.current?.name)
          .catch(console.error);
      }
    }
  }, [formFieldValue, imageToRender]);

  return {
    areActionsDisabled,
    isLoading,
    isDraggingFile,
    formFieldErrorMessage,
    imageToRender,
    openFilePicker,
    registeredFormContext,
    dropzoneRef,
    imageInputRef,
    processedImages,
    processedImagesRef,
    activeImageIndex,
    isWindowExtraSmall,
    updateActiveImageIndex,
    isHookedToForm,
    placeholder,
    setIsImageGenerationSectionOpen,
    setActiveImageIndex,
    setImagePrompt,
    isImageGenerationSectionOpen,
    imagePrompt,
    generateImage,
  };
};
