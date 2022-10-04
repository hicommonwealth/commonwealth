/* @jsx m */

import m from 'mithril';
import { Button, PopoverMenu, Icons } from 'construct-ui';

import 'components/header/invites_menu.scss';

import app from 'state';
import { getInvitesMenuItems } from '../menus/invites_menu';

export class InvitesMenuPopover implements m.ClassComponent {
  view() {
    if (!app.config.invites?.length) return;

    return (
      <PopoverMenu
        className="InvitesMenuPopover"
        hasArrow={false}
        transitionDuration={0}
        hoverCloseDelay={0}
        trigger={
          <div class="invites-button-wrap">
            <Button
              iconLeft={Icons.MAIL}
              intent="primary"
              size="default"
              compact={true}
            />
            <div
              class="invites-count-container"
              style={
                app.config.invites.length === 1
                  ? 'padding: 2px 3px'
                  : 'padding: 2px'
              }
            >
              <div class="invites-count">{app.config.invites.length}</div>
            </div>
          </div>
        }
        position="bottom-end"
        closeOnContentClick={true}
        closeOnOutsideClick={true}
        menuAttrs={{
          align: 'left',
        }}
        content={getInvitesMenuItems()}
      />
    );
  }
}
