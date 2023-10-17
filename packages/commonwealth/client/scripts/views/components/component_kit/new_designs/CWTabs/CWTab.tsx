import React from 'react';
import clsx from 'clsx';

import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

import './CWTab.scss';

interface CWTabProps {
  label: string;
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
      className={clsx('CWTab', { isSelected, isDisabled })}
      disabled={isDisabled}
      onClick={onClick}
    >
      <CWText className="label">{label}</CWText>
      {showTag && <CWTag label="New" type="new" iconName="newStar" />}
    </button>
  );
};

export default CWTab;
