import { trpc } from 'utils/trpcClient';

function useGetTagUsage(tagId: number | undefined) {
  return trpc.tag.getTagUsage.useQuery(
    { id: tagId as number },
    {
      enabled: !!tagId,
      refetchOnWindowFocus: false,
    },
  );
}

export default useGetTagUsage;
