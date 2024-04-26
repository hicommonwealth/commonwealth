import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import './AdminOnboardingCard.scss';

const CARD_TYPES = {
  'launch-contest': {
    iconName: 'shape1.svg',
    title: 'Launch a contest',
    description: 'Get your community engaged by launching a weekly contest',
    ctaText: 'Launch contest',
  },
  'create-topic': {
    iconName: 'shape3.svg',
    title: 'Create a topic',
    description: 'Add custom topics to keep your discussions organized',
    ctaText: 'Create topic',
  },
  'make-group': {
    iconName: 'shape4.svg',
    title: 'Make a group',
    description: 'Set user access permissions with custom parameters',
    ctaText: 'Make group',
  },
  'enable-integrations': {
    iconName: 'shape5.svg',
    title: 'Enable integrations',
    description: 'Integrate your Discord, Snapshot, webhooks, etc.',
    ctaText: 'Integrate apps',
  },
  'create-thread': {
    iconName: 'shape6.svg',
    title: 'Create a thread',
    description: 'Organize your discussions with topics',
    ctaText: 'Create thread',
  },
};

type AdminOnboardingCardProps = {
  cardType: keyof typeof CARD_TYPES;
  isActionCompleted?: boolean;
  onCTAClick: () => any;
};

export const AdminOnboardingCard = ({
  cardType,
  isActionCompleted,
  onCTAClick,
}: AdminOnboardingCardProps) => {
  return (
    <section className="AdminOnboardingCard">
      {isActionCompleted ? (
        <CWIcon iconName="checkNew" className="check-icon" weight="bold" />
      ) : (
        <img
          className="section-icon"
          src={`/static/img/shapes/${CARD_TYPES[cardType].iconName}`}
          alt={cardType}
        />
      )}
      <div className="content">
        <CWText type="h4" disabled={isActionCompleted}>
          {CARD_TYPES[cardType].title}
        </CWText>
        <CWText type="b2" disabled={isActionCompleted}>
          {CARD_TYPES[cardType].description}
        </CWText>
      </div>
      <CWButton
        containerClassName="cta-button"
        buttonType="tertiary"
        iconRight="arrowRight"
        buttonWidth="narrow"
        label={CARD_TYPES[cardType].ctaText}
        onClick={onCTAClick}
      />
    </section>
  );
};
