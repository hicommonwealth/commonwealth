import { z } from 'zod';

import { schemas } from '@hicommonwealth/core';
import { trpc } from 'utils/trpcClient';

type UseUpdateContestMutationProps = z.infer<
  typeof schemas.commands.UpdateContestManagerMetadata.input
>;

const useUpdateContestMutation = ({
  contest_address,
  name,
  image_url,
  topic_ids,
}: UseUpdateContestMutationProps) => {
  return trpc.contest.updateContestManagerMetadata.useMutation({
    contest_address,
    name,
    image_url,
    topic_ids,
  });
};

export default useUpdateContestMutation;
