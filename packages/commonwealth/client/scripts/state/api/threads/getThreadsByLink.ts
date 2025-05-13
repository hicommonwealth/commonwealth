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
      // TODO: we are not updating cache here, because the response looks like this
      // {
      //     "status": "Success",
      //     "result": {
      //         "threads": [
      //             {
      //                 "id": 7872,
      //                 "title": "DRC%20-%20Remove%20stkDYDX%20from%20LP%20Rewards%20Formulas"
      //             }
      //         ]
      //     }
      // }
      // decide if we need to cache this?? -- atm it looks like we dont have to
      staleTime: THREAD_STALE_TIME,
      enabled: enabled,
    },
  );
};

export default useGetThreadsByLinkQuery;
