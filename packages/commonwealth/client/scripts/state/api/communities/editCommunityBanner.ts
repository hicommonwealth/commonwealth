import { trpc } from 'utils/trpcClient';

const useEditCommunityBannerMutation = () => {
  return trpc.community.updateBanner.useMutation({
    onSuccess: (_, variables) => {
      if (variables?.community_id) {
        const communityBannerKey = `${variables.community_id}-banner`;
        if (localStorage.getItem(communityBannerKey) === 'off')
          localStorage.setItem(communityBannerKey, 'on');
      }
    },
  });
};

export default useEditCommunityBannerMutation;
