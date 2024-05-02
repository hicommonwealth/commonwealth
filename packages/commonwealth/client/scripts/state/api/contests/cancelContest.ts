import { z } from 'zod';

import { schemas } from '@hicommonwealth/core';
import { trpc } from 'utils/trpcClient';

type UseCancelContestMutationProps = z.infer<
  typeof schemas.commands.CancelContestManagerMetadata.input
>;

const useCancelContestMutation = ({
  contest_address,
}: UseCancelContestMutationProps) => {
  return trpc.contest.cancelContestManagerMetadata.useMutation({
    contest_address,
  });
};

export default useCancelContestMutation;
