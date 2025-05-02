import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import ExploreCard from '../common/ExploreCard';
import './TelegramBotExplorer.scss';
import { CWTag } from '/views/components/component_kit/new_designs/CWTag';

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
        description="Earn Aura in our new TG Mini App!"
        xpPointsElement={<CWTag label="100" type="proposal" />}
        featuredIconName="telegram"
        onExploreClick={() => {}}
      />
    </section>
  );
};

export default TelegramBotExplorer;
