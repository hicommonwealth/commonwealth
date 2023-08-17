import React from 'react';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import moment from 'moment';

const buildLockMessage = (
  fromDiscordBot: boolean,
  lockedAt?: moment.Moment,
  botType?: string,
  updatedAt?: moment.Moment
) => {
  if (fromDiscordBot) {
    return `This thread was started on ${
      botType === 'discord' ? 'Discord' : 'Farcaster'
    } and cannot be edited or commented on in Common. 
   ${
     botType === 'discord'
       ? 'New comments on the original Discord thread will appear here.'
       : ''
   }`;
  }
  if (lockedAt) {
    return `This thread was locked on ${lockedAt.format(
      'MM/DD/YYYY'
    )}, meaning it can no longer be edited or commented on.`;
  }
  return `This thread has been locked, meaning it can no longer be edited or commented on. Thread was locked prior to ${updatedAt.format(
    'MM/DD/YYYY'
  )}.`;
};

type LockMessageProps = {
  lockedAt?: moment.Moment;
  updatedAt?: moment.Moment;
  fromBot?: boolean;
  botType?: string;
};

export const LockMessage = ({
  lockedAt,
  updatedAt,
  fromBot,
  botType,
}: LockMessageProps) => {
  const message = buildLockMessage(fromBot, lockedAt, botType, updatedAt);
  return (
    <div className="callout-text">
      <CWIcon className="lock-icon" iconName="lock" iconSize="small" />
      <CWText>{message}</CWText>
    </div>
  );
};
