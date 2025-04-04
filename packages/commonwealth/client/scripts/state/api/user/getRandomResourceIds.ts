import { GetRandomResourceIds } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

type UseGetRandomResourceIdsProps = z.infer<
  typeof GetRandomResourceIds.input
> & {
  enabled?: boolean;
};

const useGetRandomResourceIds = ({
  exclude_joined_communities,
  enabled = true,
}: UseGetRandomResourceIdsProps) => {
  return trpc.user.getRandomResourceIds.useQuery(
    {
      exclude_joined_communities,
    },
    {
      enabled,
    },
  );
};

export default useGetRandomResourceIds;
