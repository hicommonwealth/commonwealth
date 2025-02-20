import React from 'react';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWText } from '../../components/component_kit/cw_text';
import './Leaderboard.scss';
import QuestsExplorer from './QuestsExplorer';
// import TelegramBotExplorer from './TelegramBotExplorer';
import XPExplainerCard from './XPExplainerCard';
import XPTable from './XPTable';

const Leaderboard = () => {
  return (
    <CWPageLayout>
      <section className="Leaderboard">
        <CWText type="h2">XP Leaderboard</CWText>
        <section className="body">
          <section className="left">
            <XPTable />
          </section>
          <section className="right">
            <XPExplainerCard />
            {/* <TelegramBotExplorer /> */}
            <QuestsExplorer />
          </section>
        </section>
      </section>
    </CWPageLayout>
  );
};

export default Leaderboard;
