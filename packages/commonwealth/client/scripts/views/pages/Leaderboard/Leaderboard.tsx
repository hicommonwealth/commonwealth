import React from 'react';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import './Leaderboard.scss';
import QuestsExplorer from './QuestsExplorer';
import TelegramBotExplorer from './TelegramBotExplorer';
import XPExplainerCard from './XPExplainerCard';

const Leaderboard = () => {
  return (
    <CWPageLayout>
      <section className="Leaderboard">
        <section className="left">{/* TODO: add XP table */}</section>
        <section className="right">
          <XPExplainerCard />
          <TelegramBotExplorer />
          <QuestsExplorer />
        </section>
      </section>
    </CWPageLayout>
  );
};

export default Leaderboard;
