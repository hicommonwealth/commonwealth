import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, queryClient, SERVER_URL } from 'state/api/config';

const DOMAIN_CACHE_TIME = Infinity;
const DOMAIN_STALE_TIME = Infinity;

const fetchCustomDomain = async (): Promise<string> => {
  const response = await axios.get(
    `${SERVER_URL}/${ApiEndpoints.FETCH_DOMAIN}`,
  );

  return response.data.customDomain || '';
};

// this is needed for useInitApp because it lives outside the RQ provider
export const fetchCustomDomainQuery = async () => {
  return await queryClient.fetchQuery({
    queryKey: [ApiEndpoints.FETCH_DOMAIN],
    queryFn: fetchCustomDomain,
    cacheTime: DOMAIN_CACHE_TIME,
    staleTime: DOMAIN_STALE_TIME,
  });
};

const useFetchCustomDomainQuery = () => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_DOMAIN],
    queryFn: fetchCustomDomain,
    cacheTime: DOMAIN_CACHE_TIME,
    staleTime: DOMAIN_STALE_TIME,
  });
};

export default useFetchCustomDomainQuery;
