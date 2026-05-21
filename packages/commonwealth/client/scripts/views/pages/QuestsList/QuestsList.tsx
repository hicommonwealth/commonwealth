import React from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import QuestList from '../ExplorePage/QuestList';
import './QuestsList.scss';

const QuestsList = () => {
  return (
    <CWPageLayout>
      <section className="QuestsList">
        <QuestList minQuests={16} questsForCommunityId={app.activeChainId()} />
      </section>
    </CWPageLayout>
  );
};

export default QuestsList;
