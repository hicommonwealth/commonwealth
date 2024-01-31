import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWIcon } from '../../cw_icons/cw_icon';
import type { IconName } from '../../cw_icons/cw_icon_lookup';

import { getClasses } from 'views/components/component_kit/helpers';
import { ComponentType } from 'views/components/component_kit/types';
import './CWTab.scss';

interface CWTabProps {
  label: string | React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  isDisabled?: boolean;
  showTag?: boolean;
  iconLeft?: IconName;
  boxed?: boolean;
}

const CWTab = ({
  label,
  isDisabled,
  isSelected,
  onClick,
  showTag,
  iconLeft,
  boxed = false,
}: CWTabProps) => {
  return (
    <button
      className={getClasses(
        { isSelected, isDisabled, boxed },
        ComponentType.Tab,
      )}
      disabled={isDisabled}
      onClick={onClick}
      type="button"
    >
      {iconLeft && <CWIcon iconName={iconLeft} iconSize="small" />}
      <CWText type={boxed ? 'b2' : 'b1'} className="label">
        {label}
      </CWText>
      {showTag && <CWTag label="New" type="new" iconName="newStar" />}
    </button>
  );
};

export default CWTab;
