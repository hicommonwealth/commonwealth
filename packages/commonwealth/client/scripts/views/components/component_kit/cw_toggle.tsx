import 'components/component_kit/cw_toggle.scss';
import React from 'react';
import { setDarkMode } from '../../../helpers';
import { getClasses } from './helpers';
import type { BaseStyleProps } from './types';
import { ComponentType } from './types';

export const toggleDarkMode = (on: boolean, stateFn?: Function) => {
  setDarkMode(on);
  localStorage.setItem('user-dark-mode-state', on ? 'on' : 'off');
  stateFn(on);
};

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
