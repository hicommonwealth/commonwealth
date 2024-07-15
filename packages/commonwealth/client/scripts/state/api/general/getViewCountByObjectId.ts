import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const VIEW_COUNT_STALE_TIME = 5000; // 5 seconds

interface GetViewCountByObjectIdProps {
  communityId: string;
  objectId: number | string;
}

const getViewCountByObjectId = async ({
  communityId,
  objectId,
}: GetViewCountByObjectIdProps): Promise<number> => {
  const response = await axios.post(
    `${app.serverUrl()}${ApiEndpoints.VIEW_COUNT}`,
    {
      community_id: communityId,
      object_id: objectId,
    },
  );

  return response?.data?.result?.view_count || 0;
};

type GetViewCountByObjectIdQueryProps = {
  apiCallEnabled?: boolean;
} & GetViewCountByObjectIdProps;

const useGetViewCountByObjectIdQuery = ({
  communityId,
  objectId,
  apiCallEnabled,
}: GetViewCountByObjectIdQueryProps) => {
  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ApiEndpoints.FETCH_THREADS, communityId, objectId],
    queryFn: () => getViewCountByObjectId({ communityId, objectId }),
    staleTime: VIEW_COUNT_STALE_TIME,
    enabled: apiCallEnabled,
  });
};

export default useGetViewCountByObjectIdQuery;
