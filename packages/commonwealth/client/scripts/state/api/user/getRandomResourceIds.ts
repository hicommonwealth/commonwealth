import { GetRandomResourceIds } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

type UseGetRandomResourceIdsProps = z.infer<
  typeof GetRandomResourceIds.input
> & {
  enabled?: boolean;
};

const useGetRandomResourceIds = ({
  cursor,
  limit,
  exclude_joined_communities,
  order_by,
  order_direction,
  enabled = true,
}: UseGetRandomResourceIdsProps) => {
  return trpc.user.getRandomResourceIds.useQuery(
    {
      cursor,
      limit,
      exclude_joined_communities,
      order_by,
      order_direction,
    },
    {
      enabled,
    },
  );
};

export default useGetRandomResourceIds;
