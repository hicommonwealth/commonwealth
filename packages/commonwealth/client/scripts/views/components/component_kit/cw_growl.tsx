/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_growl.scss';
import m from 'mithril';

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
  view(vnode: m.Vnode<GrowlAttrs>) {
    const { className, position, disabled } = vnode.attrs;
    return (
      !disabled && (
        <div
          class={getClasses<{ className?: string; position: GrowlPosition }>(
            { className, position },
            ComponentType.Growl
          )}
        >
          <CWCard className="growl-card" elevation="elevation-3" interactive>
            {vnode.children}
          </CWCard>
        </div>
      )
    );
  }
}
