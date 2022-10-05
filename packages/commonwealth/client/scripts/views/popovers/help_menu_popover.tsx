/* @jsx m */

import m from 'mithril';

import app from 'state';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { CWPopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { getHelpMenuItemAttrs } from '../menus/help_menu';

export class HelpMenuPopover implements m.ClassComponent {
  view() {
    return (
      <CWPopoverMenu
        className="HelpMenuPopover"
        hasArrow={false}
        transitionDuration={0}
        hoverCloseDelay={0}
        trigger={<CWIcon disabled={!app.user.activeAccount} iconName="help" />}
        position="bottom-end"
        closeOnContentClick={true}
        closeOnOutsideClick={true}
        menuAttrs={{
          align: 'left',
        }}
        menuItems={getHelpMenuItemAttrs()}
      />
    );
  }
}
