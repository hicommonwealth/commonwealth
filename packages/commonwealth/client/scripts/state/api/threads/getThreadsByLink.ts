import type { Link } from '@hicommonwealth/shared';
import { trpc } from 'utils/trpcClient';

const THREAD_STALE_TIME = 5000; // 5 seconds

interface GetThreadsByLinkProps {
  link: Link;
  enabled: boolean;
}

// Gets all threads associated with a link(ie all threads linked to 1 proposal)
const useGetThreadsByLinkQuery = ({ link, enabled }: GetThreadsByLinkProps) => {
  return trpc.thread.getLinks.useQuery(
    { link_source: link.source, link_identifier: link.identifier },
    {
      staleTime: THREAD_STALE_TIME,
      enabled: enabled,
    },
  );
};

export default useGetThreadsByLinkQuery;
