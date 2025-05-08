import { GetXps } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

type UseGetXPsProps = z.infer<typeof GetXps.input> & {
  enabled?: boolean;
};

const XPS_STALE_TIME = 30 * 1_000; // 30 sec

const useGetXPs = ({
  community_id,
  event_name,
  from,
  to,
  user_id,
  user_or_creator_id,
  quest_id,
  enabled = true,
}: UseGetXPsProps) => {
  return trpc.user.getXps.useQuery(
    {
      community_id,
      event_name,
      from,
      to,
      user_id,
      user_or_creator_id,
      quest_id,
    },
    {
      enabled,
      staleTime: XPS_STALE_TIME,
    },
  );
};

export default useGetXPs;
