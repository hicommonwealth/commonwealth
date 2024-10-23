import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';

interface GenerateImageProps {
  prompt: string;
}

export const generateImage = async ({
  prompt,
}: GenerateImageProps): Promise<string> => {
  const res = await axios.post(`${SERVER_URL}/${ApiEndpoints.GENERATE_IMAGE}`, {
    description: prompt,
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
