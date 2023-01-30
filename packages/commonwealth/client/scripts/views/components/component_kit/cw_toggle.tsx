/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_toggle.scss';

import { ComponentType, BaseStyleProps } from './types';
import { getClasses } from './helpers';

type ToggleStyleProps = {
  checked?: boolean;
} & BaseStyleProps;

type ToggleProps = {
  onChange?: (e?: any) => void;
} & ToggleStyleProps;

export const CWToggle = (props: ToggleProps) => {
  const { className, disabled = false, onChange, checked } = props;

  const params = {
    disabled,
    onChange,
    checked,
    type: 'checkbox',
  };

  return (
    <label
      className={getClasses<ToggleStyleProps>(
        {
          checked,
          disabled,
          className,
        },
        ComponentType.Toggle
      )}
    >
      <input className="toggle-input" {...params} />
      <div className="slider" />
    </label>
  );
};
