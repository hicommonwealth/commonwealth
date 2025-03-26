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
  onProcessedImagesListChange?: (processedImages: ImageProcessed[]) => void;
  onImageGenerated?: (generatedImageUrl: string) => void;
  onImageUploaded?: (uploadedImageURL: string) => void;
  canSwitchBetweenProcessedImages?: boolean;
  processedImages?: ImageProcessed[];
  withAIImageGeneration?: boolean;
  aiGeneratedImageSize?: '1024x1024' | '512x512' | '256x256';
  disabled?: boolean;
  loading?: boolean;
  name?: string;
  hookToForm?: boolean;
  imageBehavior?: ImageBehavior;
  uploadControlClassName?: string;
};
