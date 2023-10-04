import useBrowserWindow from 'hooks/useBrowserWindow';
import 'pages/landing/crowdfunding_gallery.scss';
import React, { useState } from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { GalleryCard } from './creators_gallery';

const crowdfundingGalleryText = [
  {
    title: 'Fund new projects.',
    subtitle: `Anyone from within your community can easily turn a 
      conversation thread into a Kickstarter-like campaign.`,
  },
  {
    title: 'Create Community Endowments.',
    subtitle: `Pool funds with other like-minded folks, and fund interesting 
      projects within your community or across the web.`,
  },
  {
    title: 'Launch New Tokens.',
    subtitle: `Use a project to raise funds for a new DeFi token or NFT. 
      Optionally plug in an allowlist for KYC compliance.`,
  },
];

export const CrowdfundingGallery = () => {
  const [selectedCard, setSelectedCard] = useState(1);

  const { isWindowMediumSmallInclusive } = useBrowserWindow({});

  return (
    <div className="CrowdfundingGallery">
      <div className="header">
        <img src="static/img/misc.png" alt="" />
        <CWText type="h3" fontWeight="semiBold" isCentered>
          Leverage on-chain crowdfunding
        </CWText>
      </div>
      <div className="inner-container">
        {isWindowMediumSmallInclusive ? (
          <>
            <div className="mobile-card">
              <CWText
                type="h4"
                fontWeight="semiBold"
                className="mobile-card-text"
              >
                {crowdfundingGalleryText[0].title}
              </CWText>
              <CWText type="caption" className="mobile-card-text">
                {crowdfundingGalleryText[0].subtitle}
              </CWText>
            </div>
            <div className="mobile-card">
              <CWText
                type="h4"
                fontWeight="semiBold"
                className="mobile-card-text"
              >
                {crowdfundingGalleryText[1].title}
              </CWText>
              <CWText type="caption" className="mobile-card-text">
                {crowdfundingGalleryText[1].subtitle}
              </CWText>
            </div>
            <div className="mobile-card">
              <CWText
                type="h4"
                fontWeight="semiBold"
                className="mobile-card-text"
              >
                {crowdfundingGalleryText[2].title}
              </CWText>
              <CWText type="caption" className="mobile-card-text">
                {crowdfundingGalleryText[2].subtitle}
              </CWText>
            </div>
          </>
        ) : (
          <>
            <div className="cards-column">
              <GalleryCard
                isSelected={selectedCard === 1}
                onClick={() => setSelectedCard(1)}
                title={crowdfundingGalleryText[0].title}
                subtitle={crowdfundingGalleryText[0].subtitle}
              />
              <GalleryCard
                isSelected={selectedCard === 2}
                onClick={() => setSelectedCard(2)}
                title={crowdfundingGalleryText[1].title}
                subtitle={crowdfundingGalleryText[1].subtitle}
              />
              <GalleryCard
                isSelected={selectedCard === 3}
                onClick={() => setSelectedCard(3)}
                title={crowdfundingGalleryText[2].title}
                subtitle={crowdfundingGalleryText[2].subtitle}
              />
            </div>
            {selectedCard === 1 && <img src="static/img/card1.png" alt="" />}
            {selectedCard === 2 && <img src="static/img/card2.png" alt="" />}
            {selectedCard === 3 && <img src="static/img/card3.png" alt="" />}
          </>
        )}
      </div>
    </div>
  );
};
