/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';

import 'components/component_kit/cw_spinner.scss';

import { ComponentType } from './types';
import { CWIcon } from './cw_icons/cw_icon';
import { IconSize } from './cw_icons/types';

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
