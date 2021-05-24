import 'components/header/invites_menu.scss';

import m from 'mithril';
import { Button, ButtonGroup, PopoverMenu, Icons, MenuItem } from 'construct-ui';

import app from 'state';
import { pluralize } from 'helpers';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';

const InvitesMenu = {
  view: (vnode) => {
    if (app.config.invites?.length === 0) return;

    return m(PopoverMenu, {
      hasArrow: false,
      transitionDuration: 0,
      hoverCloseDelay: 0,
      trigger: m(Button, {
        class: 'InvitesButton',
        iconLeft: Icons.MAIL,
        intent: 'primary',
        size: 'default',
        compact: true,
      }),
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
