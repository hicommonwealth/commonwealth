/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_divider.scss';
import { getClasses } from './helpers';

import { ComponentType } from './types';

type DividerProps = {
  isVertical?: boolean;
  className?: string;
};

export const CWDivider = (props: DividerProps) => {
  const { isVertical } = props;

  return (
    <div
      className={getClasses<DividerProps>(
        { isVertical },
        ComponentType.Divider
      )}
    />
  );
};
