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
  canClose?: boolean;
  onClose?: () => void;
  ctaText: string;
  onCTAClick: () => any;
};

export const ActionCard = ({
  iconURL,
  iconAlt = '',
  title,
  description,
  isActionCompleted,
  canClose,
  onClose,
  ctaText,
  onCTAClick,
}: ActionCardProps) => {
  return (
    <section className="ActionCard">
      <div className="header">
        {isActionCompleted ? (
          <CWIcon iconName="checkNew" className="check-icon" weight="bold" />
        ) : (
          <img className="section-icon" src={iconURL} alt={iconAlt} />
        )}

        {canClose && (
          <CWIcon
            iconName="close"
            onClick={onClose}
            iconSize="medium"
            className="close-btn"
          />
        )}
      </div>
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
