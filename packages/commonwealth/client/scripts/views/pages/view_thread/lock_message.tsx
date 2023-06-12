import React from 'react';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import moment from 'moment';

const buildLockMessage = (
  lockedAt?: moment.Moment,
  updatedAt?: moment.Moment
) => {
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
};

export const LockMessage = ({ lockedAt, updatedAt }: LockMessageProps) => {
  const message = buildLockMessage(lockedAt, updatedAt);
  return (
    <div className="callout-text">
      <CWIcon className="lock-icon" iconName="lock" iconSize="small" />
      <CWText>{message}</CWText>
    </div>
  );
};
