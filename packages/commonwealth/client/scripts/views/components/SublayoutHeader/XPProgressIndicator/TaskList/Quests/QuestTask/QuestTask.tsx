import clsx from 'clsx';
import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './QuestTask.scss';

type QuestTaskProps = {
  className?: string;
  onClick: () => void;
  quest: {
    imageURL: string;
    title: string;
    xpPoints: number;
    endsOn: Date;
  };
};

const QuestTask = ({ className, quest, onClick }: QuestTaskProps) => {
  return (
    <button className={clsx('QuestTask', className)} onClick={onClick}>
      <div className="left">
        <img src={quest.imageURL} />
      </div>
      <div className="right">
        <CWText type="b1">{quest.title}</CWText>
        <div className="xp-row">
          <CWTag label={`${quest.xpPoints} XP`} type="proposal" />
          <CWText type="caption" className="days-left">
            {4} days left
          </CWText>
        </div>
      </div>
    </button>
  );
};

export default QuestTask;
