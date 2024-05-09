import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import './ActionCard.scss';

type ActionCardProps = {
  iconURL: string;
  iconAlt?: string;
  title: string;
  description: string;
  isActionCompleted?: boolean;
  ctaText: string;
  onCTAClick: () => any;
};

export const ActionCard = ({
  iconURL,
  iconAlt = '',
  title,
  description,
  isActionCompleted,
  ctaText,
  onCTAClick,
}: ActionCardProps) => {
  return (
    <section className="ActionCard">
      {isActionCompleted ? (
        <CWIcon iconName="checkNew" className="check-icon" weight="bold" />
      ) : (
        <img className="section-icon" src={iconURL} alt={iconAlt} />
      )}
      <div className="content">
        <CWText type="h4" disabled={isActionCompleted}>
          {title}
        </CWText>
        <CWText type="b2" disabled={isActionCompleted}>
          {description}
        </CWText>
      </div>
      <CWButton
        containerClassName="cta-button"
        buttonType="tertiary"
        iconRight="arrowRight"
        buttonWidth="narrow"
        label={ctaText}
        onClick={onCTAClick}
      />
    </section>
  );
};
