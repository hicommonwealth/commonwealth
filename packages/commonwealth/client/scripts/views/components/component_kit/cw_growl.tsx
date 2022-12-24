/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_growl.scss';

import { CWCard } from './cw_card';
import { getClasses } from './helpers';
import { ComponentType } from './types';

type GrowlPosition = 'bottom-left' | 'bottom-right';

type GrowlAttrs = {
  className?: string;
  disabled: boolean;
  onclose?: () => void;
  position: GrowlPosition;
};

export class CWGrowl extends ClassComponent<GrowlAttrs> {
  view(vnode: ResultNode<GrowlAttrs>) {
    const { className, position, disabled } = vnode.attrs;
    return (
      !disabled && (
        <div
          className={getClasses<{ className?: string; position: GrowlPosition }>(
            { className, position },
            ComponentType.Growl
          )}
        >
          <CWCard class="growl-card" elevation="elevation-3" interactive>
            {vnode.children}
          </CWCard>
        </div>
      )
    );
  }
}
