/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_divider.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';

type DividerProps = {
  isVertical?: boolean;
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
