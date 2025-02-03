import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './ExploreCard.scss';

type ExploreCardProps = {
  label: string;
  description: string;
  xpPoints: number;
  onExploreClick: () => void;
} & (
  | {
      featuredImgURL: string;
      featuredIconName?: never;
    }
  | {
      featuredImgURL?: never;
      featuredIconName: 'telegram';
    }
);

const ExploreCard = ({
  label,
  description,
  xpPoints,
  featuredIconName,
  featuredImgURL,
  onExploreClick,
}: ExploreCardProps) => {
  return (
    <section className="ExploreCard">
      <div className="left">
        <CWText className="label" type="h5">
          {label}
        </CWText>
        <CWText className="description mt-16" type="b2">
          {description}
        </CWText>
        <div className="row">
          <CWTag
            label={`${xpPoints} XP`}
            type="proposal"
            classNames="xp-points"
          />
          <CWButton
            label="Details"
            buttonType="tertiary"
            buttonWidth="narrow"
            buttonHeight="med"
            iconRight="arrowRight"
            type="button"
            onClick={onExploreClick}
          />
        </div>
      </div>
      <div className="right">
        {featuredIconName && (
          <CWIcon
            iconSize="xl"
            iconName={featuredIconName}
            className="featured-icon"
          />
        )}
        {featuredImgURL && (
          <img
            src={featuredImgURL}
            alt="featured-img"
            className="featured-img"
          />
        )}
      </div>
    </section>
  );
};

export default ExploreCard;
