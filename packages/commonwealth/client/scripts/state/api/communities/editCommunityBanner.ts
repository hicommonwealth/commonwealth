import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { SERVER_URL } from 'state/api/config';
import { userStore } from '../../ui/user';

interface EditCommunityBannerProps {
  communityId: string;
  bannerText: string;
}

const editCommunityBanner = async ({
  communityId,
  bannerText,
}: EditCommunityBannerProps) => {
  const response = await axios.post(`${SERVER_URL}/updateBanner`, {
    community_id: communityId,
    banner_text: bannerText,
    auth: true,
    jwt: userStore.getState().jwt,
  });

  return response.data.result;
};

const useEditCommunityBannerMutation = () => {
  return useMutation({
    mutationFn: editCommunityBanner,
    onSuccess: async (communityBanner) => {
      app.chain?.meta?.setBanner?.(communityBanner.banner_text);

      const communityBannerKey = `${app.activeChainId()}-banner`;
      if (localStorage.getItem(communityBannerKey) === 'off') {
        localStorage.setItem(communityBannerKey, 'on');
      }
    },
  });
};

export default useEditCommunityBannerMutation;
