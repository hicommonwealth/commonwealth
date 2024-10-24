import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const CONTENT_STALE_TIME = 5000; // 5 seconds

interface GetContentByUrlProps {
  contentUrl: string;
}

const getContentByUrl = async ({
  contentUrl,
}: GetContentByUrlProps): Promise<string> => {
  const response = await axios.get(contentUrl || '');
  return response?.data || '';
};

type GetContentByUrlQueryProps = {
  enabled?: boolean;
} & GetContentByUrlProps;

const useGetContentByUrlQuery = ({
  contentUrl,
  enabled = true,
}: GetContentByUrlQueryProps) => {
  return useQuery({
    queryKey: [contentUrl],
    queryFn: () => getContentByUrl({ contentUrl }),
    staleTime: CONTENT_STALE_TIME,
    enabled,
  });
};

export default useGetContentByUrlQuery;
