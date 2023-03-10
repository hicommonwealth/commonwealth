import React, { useState } from 'react';

import 'pages/landing/creators_card_section.scss';

import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type GalleryCardProps = {
  isSelected: boolean;
  onClick: () => void;
  subtitle: string;
  title: string;
};

export const GalleryCard = ({
  isSelected,
  onClick,
  subtitle,
  title,
}: GalleryCardProps) => {
  return (
    <div
      className={getClasses<{ isSelected: boolean }>(
        { isSelected },
        'GalleryCard'
      )}
      onClick={onClick}
    >
      <CWText className="gallery-card-title" type="h4" fontWeight="semiBold">
        {title}
      </CWText>
      <CWText
        className={getClasses<{ isSelected: boolean }>(
          { isSelected },
          'gallery-card-subtitle'
        )}
        type="caption"
      >
        {subtitle}
      </CWText>
    </div>
  );
};

export const CreatorsCardSection = () => {
  const [selectedCard, setSelectedCard] = useState(1);

  return (
    <div className="CreatorsCardSection">
      <CWText type="h3" fontWeight="semiBold">
        Token creators are empowered.
      </CWText>
      <CWText type="h4" fontWeight="medium">
        Commonwealth lets you simplify your community and governance, bringing
        four tools into one.
      </CWText>
      <div className="inner-container">
        <div className="cards-column">
          <GalleryCard
            isSelected={selectedCard === 1}
            onClick={() => setSelectedCard(1)}
            subtitle="Stay up-to-date on chain events like votes and large transfers."
            title="On-chain notifications."
          />
          <GalleryCard
            isSelected={selectedCard === 2}
            onClick={() => setSelectedCard(2)}
            subtitle={`Whether you use Snapshot, COMP governance contracts, or
          native Layer 1 voting, access everything from one place.`}
            title="Off-chain polling & on-chain voting."
          />
          <GalleryCard
            isSelected={selectedCard === 3}
            onClick={() => setSelectedCard(3)}
            subtitle={`Fund new tokens and community initiatives with 
          Kickstarter-like raises from a thread.`}
            title="Crowdfunding."
          />
          <GalleryCard
            isSelected={selectedCard === 4}
            onClick={() => setSelectedCard(4)}
            title="A rich forum experience"
            subtitle={`Discuss memes or key decisions, in a Discourse-style forum.
          Enhance your posts with built in Markdown and fun reactions.`}
          />
        </div>
        {selectedCard === 1 && <img src="static/img/tab1.svg" alt="" />}
        {selectedCard === 2 && <img src="static/img/tab2.svg" alt="" />}
        {selectedCard === 3 && <img src="static/img/tab3.svg" alt="" />}
        {selectedCard === 4 && <img src="static/img/tab4.svg" alt="" />}
      </div>
    </div>
  );
};
