/* @jsx m */

import m from 'mithril';

import app from 'state';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWPopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { getHelpMenuItemAttrs, getHelpMenuItems } from '../menus/help_menu';

export class HelpMenuPopover implements m.ClassComponent {
  view() {
    return (
      <CWPopoverMenu
        className="HelpMenuPopover"
        hasArrow={false}
        transitionDuration={0}
        hoverCloseDelay={0}
        trigger={
          <CWIconButton
            disabled={!app.user.activeAccount}
            iconTheme="black"
            iconName="help"
            iconSize="medium"
            inline={true}
          />
        }
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
