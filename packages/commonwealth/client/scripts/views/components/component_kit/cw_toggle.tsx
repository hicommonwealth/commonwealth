import React from 'react';

import 'components/component_kit/cw_toggle.scss';

import type { BaseStyleProps } from './types';
import { getClasses } from './helpers';
import { ComponentType } from './types';
import { setDarkMode } from '../../../helpers/darkMode';

export const toggleDarkMode = (on: boolean, stateFn?: Function) => {
  setDarkMode(on);
  localStorage.setItem('user-dark-mode-state', on ? 'on' : 'off');
  stateFn(on);
};

export type ToggleStyleProps = {
  checked?: boolean;
} & BaseStyleProps;

type ToggleProps = {
  onChange?: (e?: any) => void;
  readOnly?: boolean;
} & ToggleStyleProps;

export const CWToggle = (props: ToggleProps) => {
  const { className, disabled = false, onChange, checked, readOnly } = props;

  const params = {
    disabled,
    onChange,
    checked,
    type: 'checkbox',
    readOnly,
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
