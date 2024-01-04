import React, { useState } from 'react';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/cw_button';
import { AdminOnboardingCard } from './AdminOnboardingCard/AdminOnboardingCard';
import './AdminOnboardingSlider.scss';

export const AdminOnboardingSlider = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return;
  }

  return (
    <section className="AdminOnboardingSlider">
      <div className="header">
        <CWText type="h4">Finish setting up your community</CWText>

        <CWButton
          containerClassName="dismissBtn"
          buttonType="tertiary"
          buttonWidth="narrow"
          onClick={() => setIsVisible(false)}
          label="Dismiss"
        />
      </div>
      <div className="cards">
        <AdminOnboardingCard cardType="create-topic" onCTAClick={() => {}} />
        <AdminOnboardingCard cardType="make-group" onCTAClick={() => {}} />
        <AdminOnboardingCard
          cardType="enable-integrations"
          onCTAClick={() => {}}
        />
        <AdminOnboardingCard cardType="create-thread" onCTAClick={() => {}} />
      </div>
    </section>
  );
};
