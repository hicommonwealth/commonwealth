import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import StarredCommunity from 'models/StarredCommunity';
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
    onSuccess: async ({ response, community }) => {
      // Update existing object state
      const starredCommunity = response.data.result;

      if (starredCommunity) {
        user.setData({
          starredCommunities: [
            ...user.starredCommunities,
            new StarredCommunity(starredCommunity),
          ],
        });
      } else {
        const star = user.starredCommunities.find((c) => {
          return c.community_id === community;
        }) as StarredCommunity;

        user.setData({
          starredCommunities: [...user.starredCommunities].filter(
            (s) => s.community_id !== star.community_id,
          ),
        });
      }
    },
  });
};

export default useToggleCommunityStarMutation;
