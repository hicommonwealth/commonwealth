import React from 'react';
import { CWText } from '../../cw_text';
import { CWIcon } from '../../cw_icons/cw_icon';
import { ComponentType } from '../../types';
import './CWQuestCard.scss';

type CWQuestCardProps = {
  name: string;
  description: string;
  iconUrl?: string;
  memberCount: number;
  threadCount: number;
  reward: string;
  rewardDescription: string;
};

export const CWQuestCard = ({
  name,
  description,
  iconUrl,
  memberCount,
  threadCount,
  reward,
  rewardDescription,
}: CWQuestCardProps) => {
  return (
    <div className={ComponentType.QuestCard}>
      <div className="quest-icon">
        {iconUrl ? (
          <img src={iconUrl} alt={name} />
        ) : (
          <CWIcon iconName="trophy" iconSize="medium" />
        )}
      </div>
      <div className="quest-info">
        <div className="quest-header">
          <CWText type="h5" fontWeight="medium">
            {name}
          </CWText>
          <div className="reward-info">
            <CWText type="h5" className="reward-value">
              {reward}
            </CWText>
            <CWText type="caption" className="reward-description">
              {rewardDescription}
            </CWText>
          </div>
        </div>
        {description && (
          <CWText className="description" type="b2">
            {description}
          </CWText>
        )}
        <div className="metadata">
          <div className="member-data">
            <CWIcon iconName="users" iconSize="small" />
            <CWText className="count" type="caption">
              {memberCount.toLocaleString('en-US')} {memberCount === 1 ? 'click' : 'clicks'}
            </CWText>
          </div>
          <div className="divider" />
          <div className="thread-data">
            <CWIcon iconName="notepad" iconSize="small" />
            <CWText className="count" type="caption">
              {threadCount} {threadCount === 1 ? 'thread' : 'threads'}
            </CWText>
          </div>
        </div>
      </div>
    </div>
  );
};