/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_toggle.scss';

import { ComponentType, StyleAttrs } from './types';
import { getClasses } from './helpers';

type ToggleStyleAttrs = {
  checked?: boolean;
} & StyleAttrs;

type ToggleAttrs = {
  onchange: (e?: any) => void;
} & ToggleStyleAttrs;

export class CWToggle extends ClassComponent<ToggleAttrs> {
  view(vnode: ResultNode<ToggleAttrs>) {
    const { className, disabled = false, onchange, checked } = vnode.attrs;

    const params = {
      disabled,
      onchange,
      checked,
      type: 'checkbox',
    };

    return (
      <label
        className={getClasses<ToggleStyleAttrs>(
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
  }
}
