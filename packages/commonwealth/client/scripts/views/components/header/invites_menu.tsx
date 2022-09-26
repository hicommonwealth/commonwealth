/* @jsx m */

import m from 'mithril';
import { Button, PopoverMenu, Icons, MenuItem } from 'construct-ui';

import 'components/header/invites_menu.scss';

import app from 'state';
import { pluralize } from 'helpers';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import { LoginModal } from 'views/modals/login_modal';

export const handleEmailInvites = (state) => {
  if (!state.modalAutoTriggered && app.user) {
    state.modalAutoTriggered = true;
    if (app.config.invites?.length) {
      app.modals.create({
        modal: ConfirmInviteModal,
        data: { community: m.route.param('inviteComm') },
      });
    } else if (!app.user.activeAccount) {
      app.modals.create({
        modal: LoginModal,
      });
    }
  }
};

export class InvitesMenu implements m.ClassComponent {
  view() {
    if (!app.config.invites?.length) return;

    return (
      <PopoverMenu
        className="InvitesMenu"
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
        content={
          <MenuItem
            label={`Show ${pluralize(app.config.invites?.length, 'invite')}...`}
            onclick={() => app.modals.create({ modal: ConfirmInviteModal })}
          />
        }
      />
    );
  }
}
