import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import StarredCommunity from 'models/StarredCommunity';
import app from 'state';

interface ToggleCommunityStarProps {
  chain: string;
  isAlreadyStarred: boolean; // TODO: rename to `shouldStar`
}

const toggleCommunityStar = async ({
  chain,
  isAlreadyStarred,
}: ToggleCommunityStarProps) => {
  // TODO: the endpoint is really a toggle to star/unstar a community, migrate
  // this to use the new restful standard
  const response = await axios.post(`${app.serverUrl()}/starCommunity`, {
    chain,
    auth: true,
    jwt: app.user.jwt,
    isAlreadyStarred: isAlreadyStarred + '', // backend expects a string
  });

  return {
    response,
    chain,
  };
};

const useToggleCommunityStarMutation = () => {
  return useMutation({
    mutationFn: toggleCommunityStar,
    onSuccess: async ({ response, chain }) => {
      // Update existing object state
      const starredCommunity = response.data.result;

      if (starredCommunity) {
        app.user.addStarredCommunity(
          new StarredCommunity(starredCommunity.chain, starredCommunity.user_id)
        );
      } else {
        const star = app.user.starredCommunities.find((c) => {
          return c.chain === chain;
        });
        app.user.removeStarredCommunity(star.chain, star.user_id);
      }
    },
  });
};

export default useToggleCommunityStarMutation;
