import clsx from 'clsx';
import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import { CWText } from 'views/components/component_kit/cw_text';

import './RewardsTab.scss';

interface RewardsTabProps {
  icon: IconName;
  title: string;
  isActive: boolean;
  onClick: () => void;
}

const RewardsTab = ({ icon, title, isActive, onClick }: RewardsTabProps) => {
  return (
    <button className={clsx('RewardsTab', { isActive })} onClick={onClick}>
      <CWIcon iconName={icon} />
      <CWText type="caption" fontWeight="medium">
        {title}
      </CWText>
    </button>
  );
};

export default RewardsTab;
