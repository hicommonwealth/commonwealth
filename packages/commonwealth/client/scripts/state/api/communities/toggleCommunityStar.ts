import { trpc } from 'utils/trpcClient';
import useUserStore from '../../ui/user';

const useToggleCommunityStarMutation = () => {
  const user = useUserStore();

  return trpc.community.toggleCommunityStar.useMutation({
    onSuccess: (starred, variables) => {
      if (variables && variables.community_id) {
        user.communities
          .filter((c) => c.id === variables.community_id)
          .forEach((c) => {
            c.isStarred = starred;
          });
      }
    },
  });
};

export default useToggleCommunityStarMutation;
