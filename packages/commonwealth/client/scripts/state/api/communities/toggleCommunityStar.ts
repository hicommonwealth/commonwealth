import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { SERVER_URL } from 'state/api/config';
import useUserStore, { userStore } from '../../ui/user';

interface ToggleCommunityStarProps {
  community: string;
}

const toggleCommunityStar = async ({ community }: ToggleCommunityStarProps) => {
  // TODO: the endpoint is really a toggle to star/unstar a community, migrate
  // this to use the new restful standard
  const response = await axios.post(`${SERVER_URL}/starCommunity`, {
    chain: community,
    auth: true,
    jwt: userStore.getState().jwt,
  });

  return {
    response,
    community,
  };
};

const useToggleCommunityStarMutation = () => {
  const user = useUserStore();

  return useMutation({
    mutationFn: toggleCommunityStar,
    onSuccess: ({ community }) => {
      // Update existing object state
      user.setData({
        communities: user.communities.map((c) => ({
          ...c,
          isStarred: community === c.id ? !c.isStarred : c.isStarred,
        })),
      });
    },
  });
};

export default useToggleCommunityStarMutation;
