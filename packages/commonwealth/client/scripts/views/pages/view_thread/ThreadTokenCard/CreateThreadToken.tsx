import React from 'react';
import { ParticipationPromoCard } from '../ParticipationPromoCard';

export type CreateThreadTokenProps = {
  onLaunchClick: () => void;
};

/**
 * Admin CTA to open the thread token flow (drawer is controlled by the parent page).
 */
export const CreateThreadToken = ({
  onLaunchClick,
}: CreateThreadTokenProps) => {
  return (
    <ParticipationPromoCard
      title="Thread token"
      description="Launch a tradable token for this thread to align incentives with engagement."
      ctaLabel="Set up thread token"
      onCtaClick={onLaunchClick}
    />
  );
};
