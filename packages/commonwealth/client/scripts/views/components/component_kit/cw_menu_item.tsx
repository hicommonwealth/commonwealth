/* @jsx m */

import { IconName } from 'construct-ui';
import m from 'mithril';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

export type CWMenuItemAttrs =
  | { type: 'divider' }
  | { type: 'header'; label: string }
  | {
      disabled?: boolean;
      iconName?: IconName;
      isSecondary?: boolean;
      label: string;
      onclick: () => void;
      type?: 'action';
    };

export class CWMenuItem implements m.ClassComponent<CWMenuItemAttrs> {
  view(vnode: m.VnodeDOM<any, this>) {
    const { type, label, iconName, onclick, disabled, isSecondary } =
      vnode.attrs;

    if (type === 'header') {
      return (
        <CWText className="menu-section-header-text" type="caption">
          {label}
        </CWText>
      );
    } else if (type === 'divider') {
      return <div class="menu-section-divider" />;
    } else {
      return (
        <div
          class={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
            { disabled, isSecondary },
            'MenuItem'
          )}
          onclick={onclick}
        >
          {iconName && (
            <CWIcon
              iconName={iconName}
              className="menu-item-icon"
              iconSize="small"
            />
          )}
          <CWText type="b2" className="menu-item-text">
            {label}
          </CWText>
        </div>
      );
    }
  }
}
