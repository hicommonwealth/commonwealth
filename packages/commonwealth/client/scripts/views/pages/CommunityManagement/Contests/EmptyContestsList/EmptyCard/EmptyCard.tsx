import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import './EmptyCard.scss';

interface EmptyCardProps {
  img: string;
  title: string;
  subtitle: string;
  button: {
    label: string;
    handler: () => void;
  };
}

const EmptyCard = ({ img, title, subtitle, button }: EmptyCardProps) => {
  const handleOpenLink = () => {
    window.open('https://commonwealth.im/', '_blank');
  };

  return (
    <div className="EmptyCard">
      <img src={img} alt="empty" className="empty-img" />
      <div>
        <CWText type="h4">{title}</CWText>
        <CWText className="subtitle">{subtitle}</CWText>
      </div>
      <CWButton
        containerClassName="cta-btn"
        label={button.label}
        onClick={button.handler}
        buttonWidth="full"
      />
      <CWButton
        label="Learn more"
        buttonType="tertiary"
        onClick={handleOpenLink}
      />
    </div>
  );
};

export default EmptyCard;
