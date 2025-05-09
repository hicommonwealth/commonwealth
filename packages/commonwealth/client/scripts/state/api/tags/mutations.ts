import { trpc } from 'utils/trpcClient';

export function useCreateTagMutation() {
  const utils = trpc.useUtils();

  return trpc.tag.createTag.useMutation({
    onSuccess: () => {
      utils.tag.getTags.invalidate();
    },
  });
}

export function useUpdateTagMutation() {
  const utils = trpc.useUtils();

  return trpc.tag.updateTag.useMutation({
    onSuccess: () => {
      utils.tag.getTags.invalidate();
    },
  });
}

export function useDeleteTagMutation() {
  const utils = trpc.useUtils();

  return trpc.tag.deleteTag.useMutation({
    onSuccess: () => {
      utils.tag.getTags.invalidate();
    },
  });
}
