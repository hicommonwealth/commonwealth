import { GetXps } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

type UseGetXPsProps = z.infer<typeof GetXps.input> & {
  enabled?: boolean;
};

const useGetXPs = ({
  community_id,
  event_name,
  from,
  to,
  user_id,
  enabled = true,
}: UseGetXPsProps) => {
  return trpc.user.getXps.useQuery(
    {
      community_id,
      event_name,
      from,
      to,
      user_id,
    },
    {
      enabled,
    },
  );
};

export default useGetXPs;
