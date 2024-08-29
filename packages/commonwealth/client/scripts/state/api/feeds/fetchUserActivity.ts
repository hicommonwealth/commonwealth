import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';
import { formatActivityResponse } from './util';

const USER_ACTIVITY_STALE_TIME = 60 * 1_000; // 1 minute
const USER_ACTIVITY_CACHE_TIME = 5 * 60 * 1_000; // 5 minutes

const fetchUserActivity = async (): Promise<Thread[]> => {
  const response = await axios.post(
    `${SERVER_URL}/${ApiEndpoints.FETCH_USER_ACTIVITY}`,
    {
      jwt: userStore.getState().jwt,
    },
  );

  return formatActivityResponse(response);
};

const useFetchUserActivityQuery = ({ apiEnabled }: { apiEnabled: boolean }) => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_USER_ACTIVITY],
    queryFn: () => fetchUserActivity(),
    staleTime: USER_ACTIVITY_STALE_TIME,
    cacheTime: USER_ACTIVITY_CACHE_TIME,
    enabled: apiEnabled,
  });
};

export default useFetchUserActivityQuery;
