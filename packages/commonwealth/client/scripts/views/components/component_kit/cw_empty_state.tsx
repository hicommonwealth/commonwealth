import React from 'react';

import './cw_empty_state.scss';

import { AutomationTestProps } from '../../pages/error';
import { CWIcon } from './cw_icons/cw_icon';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { CWText } from './cw_text';

type EmptyStateProps = {
  content: string | React.ReactNode;
  iconName?: IconName;
} & AutomationTestProps;

export const CWEmptyState = ({
  content,
  iconName,
  testid,
}: EmptyStateProps) => {
  return (
    <div
      className="EmptyState"
      {...(testid && {
        'data-testid': testid,
      })}
    >
      <div className="inner-content">
        {iconName && <CWIcon iconName={iconName} iconSize="xl" />}
        {typeof content === 'string' ? <CWText>{content}</CWText> : content}
      </div>
    </div>
  );
};
