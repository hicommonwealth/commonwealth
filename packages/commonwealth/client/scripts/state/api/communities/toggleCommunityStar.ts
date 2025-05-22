import { trpc } from 'utils/trpcClient';
import useUserStore from '../../ui/user';

const useToggleCommunityStarMutation = () => {
  const user = useUserStore();

  return trpc.community.toggleCommunityStar.useMutation({
    onSuccess: (isStarred) => {
      user.setData({
        communities: user.communities.map((c) => ({ ...c, isStarred })),
      });
    },
  });
};

export default useToggleCommunityStarMutation;
