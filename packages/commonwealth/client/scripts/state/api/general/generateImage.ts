import type { ImageGenerationModel } from '@hicommonwealth/shared';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';

// Interface for the API call parameters
interface GenerateImageApiParams {
  description: string;
  model?: ImageGenerationModel;
  n?: number;
  quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high';
  response_format?: 'url' | 'b64_json';
  size?:
    | '256x256'
    | '512x512'
    | '1024x1024'
    | '1792x1024'
    | '1024x1792'
    | '1536x1024'
    | '1024x1536'
    | 'auto';
  style?: 'vivid' | 'natural';
  referenceImageUrls?: string[];
  maskUrl?: string;
  jwt: string;
}

// Interface for the function/mutation parameters (use `prompt` for user-facing name)
interface GenerateImageProps {
  prompt: string;
  model?: ImageGenerationModel;
  n?: number;
  quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high';
  response_format?: 'url' | 'b64_json';
  size?:
    | '256x256'
    | '512x512'
    | '1024x1024'
    | '1792x1024'
    | '1024x1792'
    | '1536x1024'
    | '1024x1536'
    | 'auto';
  style?: 'vivid' | 'natural';
  referenceImageUrls?: string[];
  maskUrl?: string;
}

export const generateImage = async ({
  prompt,
  model = 'gpt-image-1',
  n,
  quality,
  response_format,
  size,
  style,
  referenceImageUrls,
  maskUrl,
}: GenerateImageProps): Promise<string> => {
  const currentJwt = userStore.getState().jwt;

  // Ensure JWT exists before proceeding
  if (!currentJwt) {
    throw new Error('User not authenticated. Cannot generate image.');
  }

  const payload: GenerateImageApiParams = {
    description: prompt,
    model,
    n,
    quality,
    response_format,
    size,
    style,
    referenceImageUrls,
    maskUrl,
    jwt: currentJwt,
  };

  // Filter out undefined values (except jwt and description)
  Object.keys(payload).forEach((key) => {
    if (key !== 'jwt' && key !== 'description' && payload[key] === undefined) {
      delete payload[key];
    }
  });

  const res = await axios.post(
    `${SERVER_URL}/${ApiEndpoints.GENERATE_IMAGE}`,
    payload,
  );

  return res.data.result.imageUrl;
};

type UseGenerateImageMutationProps = {
  onSuccess?: (
    generatedImageURL: string,
    variables: GenerateImageProps,
  ) => void;
  onError?: (error: Error, variables: GenerateImageProps) => void;
};

const useGenerateImageMutation = ({
  onSuccess,
  onError,
}: UseGenerateImageMutationProps = {}) => {
  return useMutation<string, Error, GenerateImageProps>({
    mutationFn: generateImage,
    onSuccess: (generatedImageURL, variables) => {
      onSuccess?.(generatedImageURL, variables);
    },
    onError: (error, variables) => {
      onError?.(error, variables);
    },
  });
};

export default useGenerateImageMutation;
