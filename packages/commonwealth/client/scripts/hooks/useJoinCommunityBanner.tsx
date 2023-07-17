import { useEffect, useState } from 'react';
import app from 'state';
import moment from 'moment/moment';

const JOIN_COMMUNITY_BANNER_KEY = (communityId: string) =>
  `${communityId}-joinCommunityBannerClosedAt`;

const useJoinCommunityBanner = () => {
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  useEffect(() => {
    const bannerClosedAt = Number(
      localStorage.getItem(JOIN_COMMUNITY_BANNER_KEY(app.activeChainId()))
    );

    if (!bannerClosedAt) {
      setIsBannerVisible(true);
      return;
    }

    // if banner is closed, it should reappear after 1 week
    const timeDifference = moment().diff(moment(bannerClosedAt), 'week');
    const bannerClosedMoreThanWeekAgo = timeDifference >= 1;
    setIsBannerVisible(bannerClosedMoreThanWeekAgo);
  }, []);

  const handleCloseBanner = () => {
    localStorage.setItem(
      JOIN_COMMUNITY_BANNER_KEY(app.activeChainId()),
      String(Date.now())
    );
    setIsBannerVisible(false);
  };

  return { handleCloseBanner, isBannerVisible };
};

export default useJoinCommunityBanner;
