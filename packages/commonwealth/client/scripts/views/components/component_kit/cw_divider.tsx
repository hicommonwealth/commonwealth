import React from 'react';

import 'components/component_kit/cw_divider.scss';
import { getClasses } from './helpers';

import { ComponentType } from './types';

type DividerProps = {
  isVertical?: boolean;
  className?: string;
};

export const CWDivider = ({ isVertical, className }: DividerProps) => {
  return (
    <div
      className={getClasses<DividerProps>(
        { isVertical, className },
        ComponentType.Divider,
      )}
    />
  );
};
