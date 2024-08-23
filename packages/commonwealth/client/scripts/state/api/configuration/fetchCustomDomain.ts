import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ApiEndpoints, queryClient, SERVER_URL } from 'state/api/config';

const DOMAIN_CACHE_TIME = Infinity;
const DOMAIN_STALE_TIME = Infinity;

type CustomDomainResponse = {
  isCustomDomain: boolean;
  customDomainId?: string;
};

const fetchCustomDomain = async (): Promise<CustomDomainResponse> => {
  const response = await axios.get(
    `${SERVER_URL}/${ApiEndpoints.FETCH_DOMAIN}`,
  );

  const customDomain = response.data.customDomain;

  return { isCustomDomain: !!customDomain, customDomainId: customDomain };
};

// this is specifically used where you want to get custom domain synchronously (only directly from cache)
export const fetchCachedCustomDomain = () => {
  return queryClient.getQueryData<CustomDomainResponse>([
    ApiEndpoints.FETCH_DOMAIN,
  ]);
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
