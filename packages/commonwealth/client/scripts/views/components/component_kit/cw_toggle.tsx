import React from 'react';

import 'components/component_kit/cw_toggle.scss';

import type { BaseStyleProps } from './types';
import { getClasses } from './helpers';
import { ComponentType } from './types';

export const toggleDarkMode = (on: boolean, stateFn: Function) => {
  const state: string = on ? 'on' : 'off';
  localStorage.setItem('dark-mode-state', state);
  localStorage.setItem('user-dark-mode-state', state);
  document.getElementsByTagName('html')[0].classList.toggle('invert');
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
