import React, { useState } from 'react';

import 'pages/landing/crowdfunding_card_section.scss';

import { CWText } from '../../components/component_kit/cw_text';
import { GalleryCard } from './creators_card_section';

export const CrowdfundingCardSection = () => {
  const [selectedCard, setSelectedCard] = useState(1);

  return (
    <div className="CrowdfundingCardSection">
      <img src="static/img/misc.png" alt="" />
      <CWText>Leverage on-chain crowdfunding</CWText>
      <div className="inner-container">
        <div className="cards-column">
          <GalleryCard
            isSelected={selectedCard === 1}
            onClick={() => setSelectedCard(1)}
            subtitle={`Anyone from within your community can easily turn a 
            conversation thread into a Kickstarter-like campaign.`}
            title="Fund new projects."
          />
          <GalleryCard
            isSelected={selectedCard === 2}
            onClick={() => setSelectedCard(2)}
            subtitle={`Pool funds with other like-minded folks, and fund
          interesting projects within your community or across the web.`}
            title="Create Community Endowments."
          />
          <GalleryCard
            isSelected={selectedCard === 3}
            onClick={() => setSelectedCard(3)}
            subtitle={`Use a project to raise funds for a new DeFi token or NFT.
          Optionally plug in an allowlist for KYC compliance.`}
            title="Launch New Tokens."
          />
        </div>
        {selectedCard === 1 && <img src="static/img/card1.png" alt="" />}
        {selectedCard === 2 && <img src="static/img/card2.png" alt="" />}
        {selectedCard === 3 && <img src="static/img/card3.png" alt="" />}
      </div>
    </div>
  );
};
