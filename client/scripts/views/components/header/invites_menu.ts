import 'components/header/invites_menu.scss';

import m from 'mithril';
import { Button, ButtonGroup, PopoverMenu, Icons, MenuItem } from 'construct-ui';

import app from 'state';
import { pluralize } from 'helpers';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';

const InvitesMenu = {
  view: (vnode) => {
    if (!app.config.invites?.length) return;

    return m(PopoverMenu, {
      hasArrow: false,
      transitionDuration: 0,
      hoverCloseDelay: 0,
      trigger: m('.invites-button-wrap', [
        m(Button, {
          class: 'InvitesButton',
          iconLeft: Icons.MAIL,
          intent: 'primary',
          size: 'default',
          compact: true,
        }),
        m('.invites-count-pip', {
          style: (app.config.invites.length === 1)
            ? 'padding: 2px 3px'
            : 'padding: 2px'
        }, app.config.invites.length)
      ]),
      position: 'bottom-end',
      inline: true,
      closeOnContentClick: true,
      closeOnOutsideClick: true,
      menuAttrs: {
        align: 'left',
      },
      class: 'InvitesMenu',
      content: m(MenuItem, {
        label: `Show ${pluralize(app.config.invites?.length, 'invite')}...`,
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
      }),
    });
  }
};

export default InvitesMenu;
