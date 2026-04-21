import React from 'react';
import { CWText } from '../../../components/component_kit/cw_text';
import { CWButton } from '../../../components/component_kit/new_designs/CWButton';
import './ParticipationPromoCard.scss';

export type ParticipationPromoCardProps = {
  title: string;
  description: string;
  ctaLabel: string;
  onCtaClick: () => void;
};

export const ParticipationPromoCard = ({
  title,
  description,
  ctaLabel,
  onCtaClick,
}: ParticipationPromoCardProps) => {
  return (
    <div className="ParticipationPromoCard">
      <CWText type="b1" className="ParticipationPromoCard-title">
        {title}
      </CWText>
      <CWText type="caption" className="ParticipationPromoCard-description">
        {description}
      </CWText>
      <CWButton
        buttonHeight="sm"
        buttonType="primary"
        label={ctaLabel}
        onClick={(e) => {
          e.preventDefault();
          onCtaClick();
        }}
      />
    </div>
  );
};
