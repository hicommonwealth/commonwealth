/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_spinner.scss';
import { CWIcon } from './cw_icons/cw_icon';
import type { IconSize } from './cw_icons/types';

import { ComponentType } from './types';

type SpinnerAttrs = {
  size?: IconSize;
};

export class CWSpinner extends ClassComponent<SpinnerAttrs> {
  view(vnode: ResultNode<SpinnerAttrs>) {
    const { size = 'xl' } = vnode.attrs;

    return (
      <div className={ComponentType.Spinner}>
        <CWIcon iconName="cow" iconSize={size} />
      </div>
    );
  }
}
