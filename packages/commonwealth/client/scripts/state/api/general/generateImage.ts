import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';

interface GenerateImageProps {
  prompt: string;
  size?: '1024x1024' | '512x512' | '256x256';
}

export const generateImage = async ({
  prompt,
  size,
}: GenerateImageProps): Promise<string> => {
  const res = await axios.post(`${SERVER_URL}/${ApiEndpoints.GENERATE_IMAGE}`, {
    description: prompt,
    size: size,
    jwt: userStore.getState().jwt,
  });

  return res.data.result.imageUrl;
};

type UseGenerateImageMutationProps = {
  onSuccess?: (generatedImageURL: string) => void;
};

const useGenerateImageMutation = ({
  onSuccess,
}: UseGenerateImageMutationProps = {}) => {
  return useMutation({
    mutationFn: generateImage,
    onSuccess: (generatedImageURL) => {
      onSuccess?.(generatedImageURL);
    },
  });
};

export default useGenerateImageMutation;
