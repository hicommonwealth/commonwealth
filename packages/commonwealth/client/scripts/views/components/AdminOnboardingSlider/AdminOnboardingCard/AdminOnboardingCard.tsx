import React from 'react';
import { CWText } from '../../component_kit/cw_text';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import CWCircleButton from '../../component_kit/new_designs/CWCircleButton';
import './AdminOnboardingCard.scss';

const CARD_TYPES = {
  'create-topic': {
    iconName: 'chats',
    title: 'Create a topic',
    description: 'Add custom topics to keep your discussions organized',
    ctaText: 'Create topic',
  },
  'make-group': {
    iconName: 'peopleNew',
    title: 'Make a group',
    description: 'Set user access permissions with custom parameters',
    ctaText: 'Make group',
  },
  'enable-integrations': {
    iconName: 'circlesThreeplus',
    title: 'Enable integrations',
    description: 'Integrate your Discord, Snapshot, webhooks, etc.',
    ctaText: 'Integrate apps',
  },
  'create-thread': {
    iconName: 'pencil',
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
      <CWCircleButton
        disabled={isActionCompleted}
        buttonType="primary"
        onClick={(e) => e.preventDefault()}
        iconName={
          isActionCompleted
            ? 'checkNew'
            : (CARD_TYPES[cardType].iconName as any)
        }
      />
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
