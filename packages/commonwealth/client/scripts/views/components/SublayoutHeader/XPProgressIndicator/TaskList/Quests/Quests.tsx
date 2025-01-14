import clsx from 'clsx';
import React from 'react';

import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import QuestTask from './QuestTask';
import './Quests.scss';

type QuestsProps = {
  className?: string;
};

const Quests = ({ className }: QuestsProps) => {
  const handleSeeAllQuests = () => {
    // TODO: navigate to quests page
  };

  const sampleQuests = [
    {
      id: 1,
      imageURL:
        'https://cdn.pixabay.com/photo/2023/01/08/14/22/sample-7705350_640.jpg',
      title: 'UniLend Airdrop',
      xpPoints: 100,
      endsOn: new Date(),
    },
    {
      id: 2,
      imageURL:
        'https://cdn.pixabay.com/photo/2023/01/08/14/22/sample-7705350_640.jpg',
      title: 'Plasm Twitter Launch',
      xpPoints: 500,
      endsOn: new Date(),
    },
    {
      id: 3,
      imageURL:
        'https://cdn.pixabay.com/photo/2023/01/08/14/22/sample-7705350_640.jpg',
      title: 'Blackbird Quests',
      xpPoints: 200,
      endsOn: new Date(),
    },
  ];

  return (
    <div className={clsx('Quests', className)}>
      <div className="header">
        <CWText type="b1" fontWeight="semiBold">
          Weekly Quests
        </CWText>
        <CWButton
          label="See all"
          iconRight="arrowRight"
          buttonHeight="sm"
          buttonWidth="narrow"
          buttonType="tertiary"
          onClick={handleSeeAllQuests}
        />
      </div>
      <div className="list">
        {sampleQuests.map((quest) => (
          <QuestTask key={quest.id} quest={quest} onClick={() => {}} />
        ))}
      </div>
    </div>
  );
};

export default Quests;
