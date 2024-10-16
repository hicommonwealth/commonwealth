import { useQuery } from '@tanstack/react-query';
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

type GenerateImageQueryProps = {
  apiCallEnabled?: boolean;
} & GenerateImageProps;

const useGenerateImageQuery = ({
  prompt,
  apiCallEnabled,
}: GenerateImageQueryProps) => {
  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ApiEndpoints.GENERATE_IMAGE, prompt],
    queryFn: () => generateImage({ prompt }),
    staleTime: Infinity,
    enabled: apiCallEnabled,
  });
};

export default useGenerateImageQuery;
