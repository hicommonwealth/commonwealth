import type { ImageGenerationModel } from '@hicommonwealth/shared';

export enum ImageBehavior {
  Fill = 'cover',
  Tiled = 'repeat',
  Circle = 'circle',
}

export type ImageProcessed = {
  url: string;
  isGenerated: boolean;
  isUploaded: boolean;
  isProvidedViaProps: boolean;
  isProvidedViaFormState: boolean;
  unixTimestamp: number;
};

export type ImageProcessingProps = {
  isGenerating: boolean;
  isUploading: boolean;
};

export type UploadControlProps = {
  imageURL?: string;
  onImageProcessingChange?: (process: ImageProcessingProps) => void;
  onProcessedImagesListChange?: (images: ImageProcessed[]) => void;
  onImageGenerated?: (generatedImageUrl: string) => void;
  onImageUploaded?: (uploadedImageURL: string) => void;
  canSwitchBetweenProcessedImages?: boolean;
  processedImages?: ImageProcessed[];
  withAIImageGeneration?: boolean;
  disabled?: boolean;
  loading?: boolean;
  name?: string;
  hookToForm?: boolean;
  imageBehavior?: ImageBehavior;
  uploadControlClassName?: string;
  usePersistentPromptMode?: boolean;
  onAddCurrentToReference?: () => void;
  canAddCurrentToReference?: boolean;
  referenceImageUrls?: string[];
  referenceTexts?: string[];
  model?: ImageGenerationModel;
};

export interface CWImageInputProps {
  name: string;
  label?: string;
  hookToForm?: boolean;
  initialImageUrl?: string;
  initialPrompt?: string;
  onImageUploaded?: (url: string) => void;
  onImageGenerated?: (url: string) => void;
  onImageProcessingChange?: (status: ImageProcessingProps) => void;
  onAddCurrentToReference?: () => void;
  withAIImageGeneration?: boolean;
  loading?: boolean;
  canSwitchBetweenProcessedImages?: boolean;
  usePersistentPromptMode?: boolean;
  canAddCurrentToReference?: boolean;
  referenceImageUrls?: string[];
  referenceTexts?: string[];
  model?: ImageGenerationModel;
}
