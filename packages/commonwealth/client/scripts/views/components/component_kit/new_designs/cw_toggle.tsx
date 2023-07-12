import React from 'react';

import 'components/component_kit/new_designs/cw_toggle.scss';

import type { BaseStyleProps } from '../types';
import { getClasses } from '../helpers';
import { ComponentType } from '../types';
import { setDarkMode } from '../../../../helpers/darkMode';

export const toggleDarkMode = (on: boolean, stateFn?: Function) => {
  setDarkMode(on);
  localStorage.setItem('user-dark-mode-state', on ? 'on' : 'off');
  stateFn(on);
};

export type ToggleStyleProps = {
  checked?: boolean;
  size: 'small' | 'large';
} & BaseStyleProps;

export type ToggleProps = {
  onChange?: (e?: any) => void;
} & ToggleStyleProps;

export const CWToggle = (props: ToggleProps) => {
  const { className, disabled = false, onChange, checked, size } = props;

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
          size,
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
