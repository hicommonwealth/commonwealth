import { useFlag } from 'hooks/useFlag';
import React from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../404';
import QuestList from '../Communities/QuestList';
import './QuestsList.scss';

const QuestsList = () => {
  const xpEnabled = useFlag('xp');

  if (!xpEnabled) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <section className="QuestsList">
        <QuestList minQuests={16} questsForCommunityId={app.activeChainId()} />
      </section>
    </CWPageLayout>
  );
};

export default QuestsList;
