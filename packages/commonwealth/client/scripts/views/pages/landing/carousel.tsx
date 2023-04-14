import { useCommonNavigate } from 'navigation/helpers';

import 'pages/landing/carousel.scss';
import React, { useState } from 'react';
import { useInterval } from 'usehooks-ts';
import { CWCommunityAvatar } from '../../components/component_kit/cw_community_avatar';
import { CWText } from '../../components/component_kit/cw_text';

import type { Chain } from './index';

type CarouselProps = {
  chains: Array<Chain>;
};

export const Carousel = ({ chains }: CarouselProps) => {
  const navigate = useCommonNavigate();

  const [currentChainsIdx, setCurrentChainsIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useInterval(
    () => {
      setCurrentChainsIdx(currentChainsIdx + 4);
    },
    !isPaused ? 3000 : null
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
        {chains.slice(currentChainsIdx, currentChainsIdx + 4).map((c, i) => (
          <div
            key={i}
            className="carousel-card"
            onClick={() => navigate(c.id)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <CWCommunityAvatar community={c.chainInfo} size="xxl" />
            <CWText type="h4" fontWeight="semiBold" isCentered>
              {c.name}
            </CWText>
          </div>
        ))}
      </div>
    </div>
  );
};
