import { trpc } from 'utils/trpcClient';

const useUpdateCommunityDirectoryTags = () => {
  return trpc.community.updateCommunityDirectoryTags.useMutation();
};

export default useUpdateCommunityDirectoryTags;
