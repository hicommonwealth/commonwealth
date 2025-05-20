import { trpc } from 'utils/trpcClient';

function useCreateTagMutation() {
  const utils = trpc.useUtils();

  return trpc.tag.createTag.useMutation({
    onSuccess: () => {
      utils.tag.getTags.invalidate();
    },
  });
}

export default useCreateTagMutation;
