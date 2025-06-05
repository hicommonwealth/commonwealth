import { trpc } from 'utils/trpcClient';

const useGetJudgeStatusQuery = (communityId: string | null | undefined) => {
  return trpc.contest.getJudgeStatus.useQuery(
    {
      community_id: communityId!,
    },
    {
      enabled: !!communityId,
      staleTime: 0,
      //cacheTime: 0,
      refetchOnMount: 'always',
    },
  );
};

export default useGetJudgeStatusQuery;
