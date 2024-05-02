import { z } from 'zod';

import { schemas } from '@hicommonwealth/core';
import { trpc } from 'utils/trpcClient';

type UseCreateContestMutationProps = z.infer<
  typeof schemas.commands.CreateContestManagerMetadata.input
>;

const useCreateContestMutation = ({
  contest_address,
  name,
  image_url,
  funding_token_address,
  prize_percentage,
  payout_structure,
  interval,
  ticker,
  decimals,
  topic_ids,
}: UseCreateContestMutationProps) => {
  return trpc.contest.createContestManagerMetadata.useMutation({
    contest_address,
    name,
    image_url,
    funding_token_address,
    prize_percentage,
    payout_structure,
    interval,
    ticker,
    decimals,
    topic_ids,
  });
};

export default useCreateContestMutation;
