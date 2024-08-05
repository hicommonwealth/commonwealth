import { trpc } from 'utils/trpcClient';

type UseGetNewContentProps = {
  enabled?: boolean;
};

const useGetNewContent = ({ enabled = true }: UseGetNewContentProps) => {
  return trpc.user.getNewContent.useQuery(
    {},
    {
      enabled,
    },
  );
};

export default useGetNewContent;
