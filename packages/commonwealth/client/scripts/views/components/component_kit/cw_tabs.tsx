/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_tabs.scss';

import { getClasses } from './helpers';
import { ComponentType } from './types';
import { CWText } from './cw_text';

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
