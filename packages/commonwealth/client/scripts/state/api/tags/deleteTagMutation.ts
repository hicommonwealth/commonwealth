import { trpc } from 'utils/trpcClient';

function useDeleteTagMutation() {
  const utils = trpc.useUtils();

  return trpc.tag.deleteTag.useMutation({
    onSuccess: () => {
      utils.tag.getTags.invalidate();
    },
  });
}

export default useDeleteTagMutation;
