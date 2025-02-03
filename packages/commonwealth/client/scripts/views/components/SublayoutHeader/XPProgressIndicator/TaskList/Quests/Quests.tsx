import clsx from 'clsx';
import React from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import QuestTask from './QuestTask';
import { QuestTaskQuest } from './QuestTask/QuestTask';
import './Quests.scss';

type QuestsProps = {
  className?: string;
  hideSeeAllBtn?: boolean;
  headerLabel: string;
  quests: QuestTaskQuest[];
};

const Quests = ({
  className,
  hideSeeAllBtn = false,
  headerLabel,
  quests,
}: QuestsProps) => {
  const navigate = useCommonNavigate();

  const handleSeeAllQuests = () => {
    navigate('/explore');
  };

  const handleQuestCTAClick = (questId: number) => {
    navigate(`/quest/${questId}`, {}, null);
  };

  return (
    <div className={clsx('Quests', className)}>
      <div className="header">
        <CWText type="b1" fontWeight="semiBold">
          {headerLabel}
        </CWText>
        {!hideSeeAllBtn && (
          <CWButton
            label="See all"
            iconRight="arrowRight"
            buttonHeight="sm"
            buttonWidth="narrow"
            buttonType="tertiary"
            onClick={handleSeeAllQuests}
          />
        )}
      </div>
      {quests.length === 0 ? (
        <div className="empty-task-list">
          <CWText type="b1">No quests available</CWText>{' '}
        </div>
      ) : (
        <div className="list">
          {quests.map((quest) => (
            <QuestTask
              key={quest.id}
              quest={quest}
              onClick={() => handleQuestCTAClick(quest.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Quests;
