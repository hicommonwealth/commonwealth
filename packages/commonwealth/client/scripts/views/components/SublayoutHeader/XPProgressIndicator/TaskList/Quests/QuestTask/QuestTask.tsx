import clsx from 'clsx';
import { calculateQuestTimelineLabel } from 'helpers/quest';
import React, { ReactNode } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import './QuestTask.scss';

export type QuestTaskQuest = {
  id: number;
  communityId?: string;
  imageURL: string;
  isCompleted: boolean;
  title: string;
  endDate: Date;
  xpPointsElement: ReactNode;
  startDate: Date;
};

type QuestTaskProps = {
  className?: string;
  onClick: () => void;
  quest: QuestTaskQuest;
};

const QuestTask = ({ className, quest, onClick }: QuestTaskProps) => {
  return (
    <button className={clsx('QuestTask', className)} onClick={onClick}>
      <div className="left">
        <img src={quest.imageURL} />
      </div>
      <div className="right">
        <CWText type="b1">
          {quest.title}
          {quest.isCompleted && <CWIcon iconName="check" iconSize="small" />}
        </CWText>
        <div className="xp-row">
          {quest.xpPointsElement}
          <CWText
            type="caption"
            className="timeline-label"
            fontWeight="semiBold"
          >
            {calculateQuestTimelineLabel({
              startDate: quest.startDate,
              endDate: quest.endDate,
            })}
          </CWText>
        </div>
      </div>
    </button>
  );
};

export default QuestTask;
