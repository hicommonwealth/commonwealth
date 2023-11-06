import React, { useState } from 'react';
import { useInterval } from 'usehooks-ts';

import 'pages/landing/carousel.scss';

import type { Community } from './index';

import { useCommonNavigate } from 'navigation/helpers';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';

type CarouselProps = {
  communities: Array<Community>;
};

export const Carousel = ({ communities }: CarouselProps) => {
  const navigate = useCommonNavigate();

  const [currentCommunityIdx, setCurrentCommunityIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useInterval(
    () => {
      setCurrentCommunityIdx(currentCommunityIdx + 4);
    },
    !isPaused ? 3000 : null,
  );

  return (
    <div className="Carousel">
      <div className="header">
        <CWText type="h3" fontWeight="semiBold" isCentered>
          Every token, every chain.
        </CWText>
        <CWText type="h4" fontWeight="medium" isCentered>
          Subscribe to chain activity like whale transfers or major votes.
          Discuss new ideas, crowdfund projects, and access native governance
          for Layer 1s, tokens, and NFTs alike.
        </CWText>
      </div>
      <div className="cards-row">
        {communities
          .slice(currentCommunityIdx, currentCommunityIdx + 4)
          .map((c, i) => (
            <div
              key={i}
              className="carousel-card"
              onClick={() => navigate(c.id)}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <CWCommunityAvatar community={c.communityInfo} size="xxl" />
              <CWText type="h4" fontWeight="semiBold" isCentered>
                {c.name}
              </CWText>
            </div>
          ))}
      </div>
    </div>
  );
};
