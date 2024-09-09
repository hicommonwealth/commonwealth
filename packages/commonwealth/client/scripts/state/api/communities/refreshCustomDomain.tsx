import { z } from 'zod';

import { RefreshCustomDomain } from '@hicommonwealth/schemas';
import { trpc } from 'utils/trpcClient';

type UseRefreshCustomDomainQueryProps = z.infer<
  typeof RefreshCustomDomain.input
> & {
  enabled: boolean;
};

const useRefreshCustomDomainQuery = ({
  custom_domain,
  enabled,
}: UseRefreshCustomDomainQueryProps) => {
  return trpc.community.refreshCustomDomain.useQuery(
    {
      custom_domain,
    },
    { enabled, retry: false },
  );
};

export default useRefreshCustomDomainQuery;
