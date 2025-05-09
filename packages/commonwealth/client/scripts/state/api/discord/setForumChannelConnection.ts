import { trpc } from 'utils/trpcClient';

const useSetForumChannelConnectionMutation = () => {
  return trpc.community.updateTopicChannel.useMutation();
};

export default useSetForumChannelConnectionMutation;
