import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import StarredCommunity from 'models/StarredCommunity';
import app from 'state';

interface ToggleCommunityStarProps {
  community: string;
  isAlreadyStarred: boolean; // TODO: rename to `shouldStar`
}

const toggleCommunityStar = async ({
  community,
  isAlreadyStarred,
}: ToggleCommunityStarProps) => {
  // TODO: the endpoint is really a toggle to star/unstar a community, migrate
  // this to use the new restful standard
  const response = await axios.post(`${app.serverUrl()}/starCommunity`, {
    chain: community,
    auth: true,
    jwt: app.user.jwt,
    isAlreadyStarred: isAlreadyStarred + '', // backend expects a string
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
        app.user.addStarredCommunity(
          new StarredCommunity(
            starredCommunity.chain,
            starredCommunity.user_id,
          ),
        );
      } else {
        const star = app.user.starredCommunities.find((c) => {
          return c.chain === community;
        });
        app.user.removeStarredCommunity(star.chain, star.user_id);
      }
    },
  });
};

export default useToggleCommunityStarMutation;
