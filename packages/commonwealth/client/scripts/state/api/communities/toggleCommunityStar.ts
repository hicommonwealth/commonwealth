import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import StarredCommunity from 'models/StarredCommunity';
import app from 'state';

interface ToggleCommunityStarProps {
  community: string;
}

const toggleCommunityStar = async ({ community }: ToggleCommunityStarProps) => {
  // TODO: the endpoint is really a toggle to star/unstar a community, migrate
  // this to use the new restful standard
  const response = await axios.post(`${app.serverUrl()}/starCommunity`, {
    chain: community,
    auth: true,
    jwt: app.user.jwt,
  });

  return {
    response,
    community,
  };
};

const useToggleCommunityStarMutation = () => {
  return useMutation({
    mutationFn: toggleCommunityStar,
    onSuccess: async ({ response, community }) => {
      // Update existing object state
      const starredCommunity = response.data.result;

      if (starredCommunity) {
        app.user.addStarredCommunity(new StarredCommunity(starredCommunity));
      } else {
        const star = app.user.starredCommunities.find((c) => {
          return c.community_id === community;
        });
        app.user.removeStarredCommunity(star.community_id, star.user_id);
      }

      app.sidebarRedraw.emit('redraw');
    },
  });
};

export default useToggleCommunityStarMutation;
