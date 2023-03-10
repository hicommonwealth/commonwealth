import React, { useState } from 'react';

import 'pages/landing/creators_card_section.scss';

import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type CreatorsCardProps = {
  isActive: boolean;
  onClick: () => void;
  subtitle: string;
  title: string;
};

const CreatorsCard = ({
  isActive,
  onClick,
  subtitle,
  title,
}: CreatorsCardProps) => {
  return (
    <div
      className={getClasses<{ isActive: boolean }>(
        { isActive },
        'creators-card'
      )}
      onClick={onClick}
    >
      <CWText className="creators-card-title" type="h4" fontWeight="semiBold">
        {title}
      </CWText>
      <CWText
        className={getClasses<{ isActive: boolean }>(
          { isActive },
          'creators-card-subtitle'
        )}
        type="caption"
      >
        {subtitle}
      </CWText>
    </div>
  );
};

export const CreatorsCardSection = () => {
  const [activeCard, setActiveCard] = useState(1);

  return (
    <div className="CreatorsCardSection">
      <CWText type="h3" fontWeight="semiBold">
        Token creators are empowered
      </CWText>
      <CWText type="h4" fontWeight="medium">
        Commonwealth lets you simplify your community and governance, bringing
        four tools into one.
      </CWText>
      <div className="inner-container">
        <div className="creators-cards-column">
          <CreatorsCard
            isActive={activeCard === 1}
            onClick={() => setActiveCard(1)}
            subtitle="Stay up-to-date on chain events like votes and large transfers"
            title="On-chain notifications"
          />
          <CreatorsCard
            isActive={activeCard === 2}
            onClick={() => setActiveCard(2)}
            subtitle={`Whether you use Snapshot, COMP governance contracts, or
          native Layer 1 voting, access everything from one place`}
            title="Off-chain polling & on-chain voting"
          />
          <CreatorsCard
            isActive={activeCard === 3}
            onClick={() => setActiveCard(3)}
            subtitle={`Fund new tokens and community initiatives with 
          Kickstarter-like raises from a thread`}
            title="Crowdfunding"
          />
          <CreatorsCard
            isActive={activeCard === 4}
            onClick={() => setActiveCard(4)}
            title="A rich forum experience"
            subtitle={`Discuss memes or key decisions, in a Discourse-style forum.
          Enhance your posts with built in Markdown and fun reactions`}
          />
        </div>
        {activeCard === 1 && <img src="static/img/tab1.svg" alt="" />}
        {activeCard === 2 && <img src="static/img/tab2.svg" alt="" />}
        {activeCard === 3 && <img src="static/img/tab3.svg" alt="" />}
        {activeCard === 4 && <img src="static/img/tab4.svg" alt="" />}
      </div>
    </div>
  );
};
