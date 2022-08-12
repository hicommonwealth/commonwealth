/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_growl.scss';

import { CWCard } from './cw_card';
import { getClasses } from './helpers';
import { ComponentType } from './types';

type GrowlPosition = 'bottom-left' | 'bottom-right';

type GrowlAttrs = {
  onclose: () => void;
  position: GrowlPosition;
  className?: string;
};

export class CWGrowl implements m.ClassComponent<GrowlAttrs> {
  view(vnode) {
    const { className, position } = vnode.attrs;
    return (
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
    );
  }
}
