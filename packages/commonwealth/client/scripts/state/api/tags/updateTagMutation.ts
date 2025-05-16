import { trpc } from 'utils/trpcClient';

function useUpdateTagMutation() {
  const utils = trpc.useUtils();

  return trpc.tag.updateTag.useMutation({
    onSuccess: () => {
      utils.tag.getTags.invalidate();
    },
  });
}

export default useUpdateTagMutation;
