import React, { ReactNode } from 'react';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { IconName } from '../component_kit/cw_icons/cw_icon_lookup';
import { getClasses } from '../component_kit/helpers';
import './Option.scss';

export type OptionProps = {
  size?: 'default' | 'compact',
  iconLeft?: IconName;
  iconRight?: ReactNode;
  isSelected: boolean;
  label: string;
  onClick: (e: any) => void;
};

export const Option = ({
  size = 'default',
  iconRight,
  isSelected,
  label,
  onClick,
  iconLeft,
}: OptionProps) => {
  return (
    <div
      className={getClasses<{ isSelected: boolean }>(
        { isSelected },
        `select-option ${`size-${size}`}`
      )}
      onClick={onClick}
    >
      {iconLeft && <CWIcon iconName={iconLeft} iconSize="small" />}
      <p>{label}</p>
      {iconRight}
    </div>
  );
};
