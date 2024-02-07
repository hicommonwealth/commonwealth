import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

import './CWTab.scss';
import { getClasses } from 'views/components/component_kit/helpers';
import { ComponentType } from 'views/components/component_kit/types';

interface CWTabProps {
  label: string | React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  isDisabled?: boolean;
  showTag?: boolean;
}

const CWTab = ({
  label,
  isDisabled,
  isSelected,
  onClick,
  showTag,
}: CWTabProps) => {
  return (
    <button
      className={getClasses({ isSelected, isDisabled }, ComponentType.Tab)}
      disabled={isDisabled}
      onClick={onClick}
      type="button"
    >
      <CWText className="label">{label}</CWText>
      {showTag && <CWTag label="New" type="new" iconName="newStar" />}
    </button>
  );
};

export default CWTab;
