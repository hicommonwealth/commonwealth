import React from 'react';

import 'components/component_kit/cw_tabs.scss';
import { CWText } from './cw_text';

import { getClasses } from './helpers';
import { ComponentType } from './types';

type TabStyleProps = {
  disabled?: boolean;
  isSelected: boolean;
};

type TabProps = {
  label: string;
  onClick: () => void;
} & TabStyleProps;

export const CWTab = (props: TabProps) => {
  const { disabled, isSelected, label, onClick } = props;

  return (
    <div
      className={getClasses<TabStyleProps>(
        { isSelected, disabled },
        ComponentType.Tab
      )}
      onClick={onClick}
    >
      <CWText
        type="h4"
        className="tab-label-text"
        fontWeight={isSelected ? 'bold' : 'semiBold'}
      >
        {label}
      </CWText>
    </div>
  );
};

export const CWTabBar = (props: React.PropsWithChildren) => {
  return <div className={ComponentType.TabBar}>{props.children}</div>;
};
