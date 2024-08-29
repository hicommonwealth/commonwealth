import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { formatActivityResponse } from './util';

const USER_ACTIVITY_STALE_TIME = 5 * 60 * 1_000; // 5 minutes (backend caches for 5 minutes as well)
const USER_ACTIVITY_CACHE_TIME = 5 * 60 * 1_000; // 5 minutes

const fetchGlobalActivity = async (): Promise<Thread[]> => {
  const response = await axios.post(
    `${SERVER_URL}/${ApiEndpoints.FETCH_GLOBAL_ACTIVITY}`,
  );

  return formatActivityResponse(response);
};

const useFetchGlobalActivityQuery = ({
  apiEnabled,
}: {
  apiEnabled: boolean;
}) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_GLOBAL_ACTIVITY],
    queryFn: () => fetchGlobalActivity(),
    staleTime: USER_ACTIVITY_STALE_TIME,
    cacheTime: USER_ACTIVITY_CACHE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchGlobalActivityQuery;
