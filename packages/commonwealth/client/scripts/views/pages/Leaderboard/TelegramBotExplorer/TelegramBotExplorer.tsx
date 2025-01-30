import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import ExploreCard from '../common/ExploreCard';
import './TelegramBotExplorer.scss';

const TelegramBotExplorer = () => {
  return (
    <section className="TelegramBotExplorer">
      <div className="header">
        <CWText type="h4">Telegram Bot</CWText>
        <CWButton
          label="See all"
          buttonType="tertiary"
          buttonWidth="narrow"
          buttonHeight="med"
          iconRight="arrowRight"
          type="button"
        />
      </div>
      <ExploreCard
        label="Tap-to-Earn"
        description="Earn XP in our new TG Mini App!"
        xpPoints={100}
        featuredIconName="telegram"
        onExploreClick={() => {}}
      />
    </section>
  );
};

export default TelegramBotExplorer;
