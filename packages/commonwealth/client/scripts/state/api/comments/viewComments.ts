import { ViewComments } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';

const COMMENTS_STALE_TIME = 30 * 1_000; // 30 s

type useViewCommentsProps = z.infer<typeof ViewComments.input> & {
  apiEnabled?: boolean;
};

const useViewCommentsQuery = ({
  thread_id,
  apiEnabled = true,
}: useViewCommentsProps) => {
  return trpc.comment.viewComments.useQuery(
    { thread_id },
    {
      enabled: apiEnabled,
      staleTime: COMMENTS_STALE_TIME,
    },
  );
};

export default useViewCommentsQuery;
