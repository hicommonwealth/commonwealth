import React, { useEffect, useState } from 'react';

import 'pages/landing/creators_gallery.scss';

import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { isWindowSmallInclusive } from '../../components/component_kit/helpers';

const creatorsGalleryText = [
  {
    title: ' On-chain notifications.',
    subtitle: 'Stay up-to-date on chain events like votes and large transfers.',
  },
  {
    title: 'Off-chain polling & on-chain voting.',
    subtitle: `Whether you use Snapshot, COMP governance contracts, 
      or native Layer 1 voting, access everything from one place.`,
  },
  {
    title: 'Crowdfunding.',
    subtitle: `Fund new tokens and community initiatives with Kickstarter-like 
      raises from a thread.`,
  },
  {
    title: 'A rich forum experience.',
    subtitle: `Discuss memes or key decisions, in a Discourse-style forum. Enhance 
      your posts with built in Markdown and fun reactions.`,
  },
];

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

export const CreatorsGallery = () => {
  const [selectedCard, setSelectedCard] = useState(1);
  const [windowIsSmallInclusive, setWindowIsSmallInclusive] = useState(
    isWindowSmallInclusive(window.innerWidth)
  );

  useEffect(() => {
    const onResize = () => {
      setWindowIsSmallInclusive(isWindowSmallInclusive(window.innerWidth));
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="CreatorsGallery">
      <div className="header">
        <CWText type="h3" fontWeight="semiBold">
          Token creators are empowered.
        </CWText>
        <CWText type="h4" fontWeight="medium">
          Commonwealth lets you simplify your community and governance, bringing
          four tools into one.
        </CWText>
      </div>
      <div className="inner-container">
        {windowIsSmallInclusive ? (
          <>
            <div className="mobile-card">
              <CWText
                type="h4"
                fontWeight="semiBold"
                className="mobile-card-text"
              >
                {creatorsGalleryText[0].title}
              </CWText>
              <CWText type="caption" className="mobile-card-text">
                {creatorsGalleryText[0].subtitle}
              </CWText>
            </div>
            <div className="mobile-card">
              <CWText
                type="h4"
                fontWeight="semiBold"
                className="mobile-card-text"
              >
                {creatorsGalleryText[1].title}
              </CWText>
              <CWText type="caption" className="mobile-card-text">
                {creatorsGalleryText[2].title}
              </CWText>
            </div>
            <div className="mobile-card">
              <CWText
                type="h4"
                fontWeight="semiBold"
                className="mobile-card-text"
              >
                {creatorsGalleryText[2].title}
              </CWText>
              <CWText type="caption" className="mobile-card-text">
                {creatorsGalleryText[2].subtitle}
              </CWText>
            </div>
            <div className="mobile-card">
              <CWText
                type="h4"
                fontWeight="semiBold"
                className="mobile-card-text"
              >
                {creatorsGalleryText[3].title}
              </CWText>
              <CWText type="caption" className="mobile-card-text">
                {creatorsGalleryText[3].subtitle}
              </CWText>
            </div>
          </>
        ) : (
          <>
            <div className="cards-column">
              <GalleryCard
                isSelected={selectedCard === 1}
                onClick={() => setSelectedCard(1)}
                title={creatorsGalleryText[0].title}
                subtitle={creatorsGalleryText[0].subtitle}
              />
              <GalleryCard
                isSelected={selectedCard === 2}
                onClick={() => setSelectedCard(2)}
                title={creatorsGalleryText[1].title}
                subtitle={creatorsGalleryText[1].subtitle}
              />
              <GalleryCard
                isSelected={selectedCard === 3}
                onClick={() => setSelectedCard(3)}
                title={creatorsGalleryText[2].title}
                subtitle={creatorsGalleryText[2].subtitle}
              />
              <GalleryCard
                isSelected={selectedCard === 4}
                onClick={() => setSelectedCard(4)}
                title={creatorsGalleryText[3].title}
                subtitle={creatorsGalleryText[3].subtitle}
              />
            </div>
            <div className="image-container">
              {selectedCard === 1 && <img src="static/img/tab1.svg" alt="" />}
              {selectedCard === 2 && <img src="static/img/tab2.svg" alt="" />}
              {selectedCard === 3 && <img src="static/img/tab3.svg" alt="" />}
              {selectedCard === 4 && <img src="static/img/tab4.svg" alt="" />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
