import { trpc } from 'utils/trpcClient';

const useGetJudgeStatusQuery = (communityId: string | null | undefined) => {
  return trpc.contest.getJudgeStatus.useQuery(
    {
      community_id: communityId!,
    },
    {
      enabled: !!communityId,
    },
  );
};

export default useGetJudgeStatusQuery;
