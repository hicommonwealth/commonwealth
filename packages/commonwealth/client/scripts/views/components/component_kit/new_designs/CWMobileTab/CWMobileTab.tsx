import clsx from 'clsx';
import React from 'react';

import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import { CWText } from 'views/components/component_kit/cw_text';

import './CWMobileTab.scss';

export interface CWMobileTabProps {
  icon: IconName;
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export const CWMobileTab = ({
  icon,
  label,
  isActive,
  onClick,
  className,
}: CWMobileTabProps) => {
  return (
    <button
      className={clsx('CWMobileTab', { isActive }, className)}
      onClick={onClick}
    >
      <CWIcon iconName={icon} />
      <CWText type="caption" fontWeight="medium">
        {label}
      </CWText>
    </button>
  );
};

export default CWMobileTab;
