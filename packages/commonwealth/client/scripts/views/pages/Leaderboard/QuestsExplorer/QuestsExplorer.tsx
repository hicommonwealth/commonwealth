import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import ExploreCard from '../common/ExploreCard';
import './QuestsExplorer.scss';

const sampleContests = [
  {
    name: 'UniLend Contest',
    description: 'UniLend - Get 100 XP by engaging in at least 10 threads!',
    xpPoints: 100,
    imgURL:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRraGmJH3xeDCcTkMkIrntBey6snM3uDje9SQ&s',
  },
  {
    name: 'UniLend Contest',
    description: 'UniLend - Get 100 XP by engaging in at least 10 threads!',
    xpPoints: 100,
    imgURL:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRraGmJH3xeDCcTkMkIrntBey6snM3uDje9SQ&s',
  },
];

const QuestsExplorer = () => {
  return (
    <section className="QuestsExplorer">
      <div className="header">
        <CWText type="h4">Quests on Common</CWText>
        <CWButton
          label="See all"
          buttonType="tertiary"
          buttonWidth="narrow"
          buttonHeight="med"
          iconRight="arrowRight"
          type="button"
        />
      </div>
      {sampleContests.map((c) => (
        <ExploreCard
          key={c.name}
          label={c.name}
          description={c.description}
          xpPoints={c.xpPoints}
          featuredImgURL={c.imgURL}
          onExploreClick={() => {}}
        />
      ))}
    </section>
  );
};

export default QuestsExplorer;
