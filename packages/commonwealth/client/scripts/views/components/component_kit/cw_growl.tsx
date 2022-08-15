/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_growl.scss';

import { CWCard } from './cw_card';
import { getClasses } from './helpers';
import { ComponentType } from './types';
import { CWPortal } from './cw_portal';

type GrowlPosition = 'bottom-left' | 'bottom-right';

type GrowlAttrs = {
  onclose: () => void;
  disabled: boolean;
  position: GrowlPosition;
  className?: string;
};

export class CWGrowl implements m.ClassComponent<GrowlAttrs> {
  view(vnode) {
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
